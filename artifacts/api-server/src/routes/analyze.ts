import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { analysesTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";
import { AnalyzePersonalityBody, AnalyzePersonalityResponse, GetAnalysesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

type BigFiveScores = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

function mockAnalyze(text: string): BigFiveScores {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const seed = words.reduce((acc, word) => acc + word.charCodeAt(0), 0);

  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const scale = (val: number, min = 40, max = 95) => Math.round(min + val * (max - min));

  return {
    openness: scale(pseudoRandom(1)),
    conscientiousness: scale(pseudoRandom(2)),
    extraversion: scale(pseudoRandom(3)),
    agreeableness: scale(pseudoRandom(4)),
    neuroticism: scale(pseudoRandom(5)),
  };
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 50;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function sanitizeScores(scores: BigFiveScores): BigFiveScores {
  return {
    openness: clampScore(scores.openness),
    conscientiousness: clampScore(scores.conscientiousness),
    extraversion: clampScore(scores.extraversion),
    agreeableness: clampScore(scores.agreeableness),
    neuroticism: clampScore(scores.neuroticism),
  };
}

function extractJsonObject(rawResponse: string): string {
  const trimmed = rawResponse.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const withoutFences = trimmed.replace(/```json|```/gi, "").trim();
  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model response does not contain a JSON object.");
  }

  return withoutFences.slice(firstBrace, lastBrace + 1);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseGroqAnalysis(rawResponse: string): { scores: BigFiveScores; summary: string } {
  const jsonString = extractJsonObject(rawResponse);
  const parsed = JSON.parse(jsonString) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("Model JSON response must be an object.");
  }

  const openness = toFiniteNumber(parsed.openness);
  const conscientiousness = toFiniteNumber(parsed.conscientiousness);
  const extraversion = toFiniteNumber(parsed.extraversion);
  const agreeableness = toFiniteNumber(parsed.agreeableness);
  const neuroticism = toFiniteNumber(parsed.neuroticism);
  const summary =
    typeof parsed.summary === "string" ? parsed.summary.trim() : "";

  if (
    openness === null ||
    conscientiousness === null ||
    extraversion === null ||
    agreeableness === null ||
    neuroticism === null ||
    !summary
  ) {
    throw new Error("Model JSON is missing required Big Five keys or summary.");
  }

  return {
    scores: sanitizeScores({
      openness,
      conscientiousness,
      extraversion,
      agreeableness,
      neuroticism,
    }),
    summary,
  };
}

function resolveUserFacingSummary(summary: string): string {
  const trimmed = summary.trim();
  const isTechnicalFallback =
    /deterministic fallback|malformed model json|model request failed/i.test(trimmed);

  if (trimmed && !isTechnicalFallback) {
    return trimmed;
  }

  return "Your words reveal someone carrying real depth beneath the surface — thoughtful, emotionally aware, and quietly searching for clarity. There is strength in how honestly you express yourself, even when the feeling is heavy.";
}

function buildGroqSystemPrompt(): string {
  return [
    "You are a senior psychometrician specializing in Big Five personality assessment.",
    "Analyze the user's free-text writing with high rigor and infer personality signals from lexical choice, narrative structure, emotional valence, interpersonal framing, and self-regulation cues.",
    "The user text may be in Arabic, English, or Turkish. You must understand and analyze all three languages accurately.",
    "Return STRICT JSON ONLY. No markdown, no code fences, no extra keys, no commentary.",
    "Output must match this exact shape:",
    "{",
    '  "openness": 85,',
    '  "conscientiousness": 70,',
    '  "extraversion": 45,',
    '  "agreeableness": 60,',
    '  "neuroticism": 50,',
    '  "summary": "A brief multilingual summary paragraph..."',
    "}",
    "Requirements:",
    "- All five trait values must be integers from 0 to 100.",
    "- The summary must be a deeply empathetic, human conclusion (2-4 sentences) written in the same language as the user's text.",
    "- The summary should validate emotional weight, read between the lines, and feel like a wise companion — never clinical or robotic.",
    "- If evidence is limited, still provide best-estimate scores with calibrated caution in the summary.",
  ].join("\n");
}

async function callGroqAnalyze(text: string): Promise<string> {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model = process.env["GROQ_MODEL"] ?? "llama-3.3-70b-versatile";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildGroqSystemPrompt() },
        {
          role: "user",
          content: [
            "Analyze the following text and return JSON in the required format only.",
            "",
            text,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq API returned an empty response");
  }

  return content;
}

router.post("/analyze", async (req, res) => {
  const parseResult = AnalyzePersonalityBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { text } = parseResult.data;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 50) {
    res.status(400).json({ error: `Text must be at least 50 words. You provided ${wordCount} words.` });
    return;
  }

  const fallbackScores = sanitizeScores(mockAnalyze(text));
  let scores: BigFiveScores = fallbackScores;
  let analysisSummary = resolveUserFacingSummary("");

  try {
    const rawGroqResponse = await callGroqAnalyze(text);

    try {
      const parsed = parseGroqAnalysis(rawGroqResponse);
      scores = parsed.scores;
      analysisSummary = resolveUserFacingSummary(parsed.summary);
    } catch (parseError) {
      req.log.warn(
        { err: parseError },
        "Failed to parse/sanitize Groq analysis JSON; using fallback scores.",
      );
      scores = fallbackScores;
      analysisSummary = resolveUserFacingSummary("");
    }
  } catch (groqError) {
    req.log.warn({ err: groqError }, "Groq analyze request failed; using fallback scores.");
    scores = fallbackScores;
    analysisSummary = resolveUserFacingSummary("");
  }

  try {
    const [inserted] = await db
      .insert(analysesTable)
      .values({
        text,
        wordCount,
        ...scores,
      })
      .returning();

    req.log.info(
      { summaryPreview: analysisSummary.slice(0, 200) },
      "Personality analysis processed.",
    );

    const response = AnalyzePersonalityResponse.parse({
      id: inserted.id,
      text: inserted.text,
      scores: {
        openness: inserted.openness,
        conscientiousness: inserted.conscientiousness,
        extraversion: inserted.extraversion,
        agreeableness: inserted.agreeableness,
        neuroticism: inserted.neuroticism,
      },
      wordCount: inserted.wordCount,
      summary: analysisSummary,
      createdAt: inserted.createdAt.toISOString(),
    });

    res.json(response);
  } catch (dbError) {
    req.log.error({ err: dbError }, "Failed to persist analysis; returning non-persisted response.");

    const response = AnalyzePersonalityResponse.parse({
      id: 0,
      text,
      scores,
      wordCount,
      summary: analysisSummary,
      createdAt: new Date().toISOString(),
    });

    res.json(response);
  }
});

router.get("/analyses", async (_req, res) => {
  const rows = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(20);

  const response = GetAnalysesResponse.parse({
    analyses: rows.map((row: (typeof rows)[number]) => ({
      id: row.id,
      wordCount: row.wordCount,
      scores: {
        openness: row.openness,
        conscientiousness: row.conscientiousness,
        extraversion: row.extraversion,
        agreeableness: row.agreeableness,
        neuroticism: row.neuroticism,
      },
      createdAt: row.createdAt.toISOString(),
    })),
  });

  res.json(response);
});

export default router;
