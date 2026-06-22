import { Router, type IRouter } from "express";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type BigFiveScores = {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
};

type ChatRequestBody = {
  message: unknown;
  scores: Partial<Record<keyof BigFiveScores, unknown>>;
  mbti?: unknown;
  profileContext?: unknown;
};

type KnowledgeSection = {
  profile_label: string;
  best_work_environments: string[];
  critical_relationship_risks: string[];
  personalized_self_development: string[];
  stress_management_strategies: string[];
};

type TraitKnowledge = {
  high: KnowledgeSection;
  low: KnowledgeSection;
};

type PsychologyKnowledgeBase = {
  version: string;
  domain: string;
  intended_use: string;
  big_five: Record<keyof BigFiveScores, TraitKnowledge>;
};

type FlatKnowledgeBase = Record<string, string>;

const router: IRouter = Router();
const currentFileDirectory = dirname(fileURLToPath(import.meta.url));
let knowledgeBasePromise: Promise<PsychologyKnowledgeBase | FlatKnowledgeBase> | null =
  null;

function getKnowledgeBaseCandidatePaths(): string[] {
  const candidates = [
    resolve(currentFileDirectory, "../../knowledge_base/psychology_knowledge.json"),
    resolve(currentFileDirectory, "../knowledge_base/psychology_knowledge.json"),
    resolve(process.cwd(), "knowledge_base/psychology_knowledge.json"),
    resolve(process.cwd(), "artifacts/api-server/knowledge_base/psychology_knowledge.json"),
    resolve(process.cwd(), "src/knowledge_base/psychology_knowledge.json"),
  ];

  return [...new Set(candidates)];
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseScores(value: unknown): BigFiveScores | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const scoreRecord = value as ChatRequestBody["scores"];

  const openness = scoreRecord.openness;
  const conscientiousness = scoreRecord.conscientiousness;
  const extraversion = scoreRecord.extraversion;
  const agreeableness = scoreRecord.agreeableness;
  const neuroticism = scoreRecord.neuroticism;

  if (
    !isFiniteNumber(openness) ||
    !isFiniteNumber(conscientiousness) ||
    !isFiniteNumber(extraversion) ||
    !isFiniteNumber(agreeableness) ||
    !isFiniteNumber(neuroticism)
  ) {
    return null;
  }

  return {
    openness,
    conscientiousness,
    extraversion,
    agreeableness,
    neuroticism,
  };
}

async function getKnowledgeBase(): Promise<PsychologyKnowledgeBase | FlatKnowledgeBase> {
  if (!knowledgeBasePromise) {
    knowledgeBasePromise = (async () => {
      const candidatePaths = getKnowledgeBaseCandidatePaths();
      let lastError: unknown = null;

      for (const filePath of candidatePaths) {
        try {
          const content = await readFile(filePath, "utf-8");
          return JSON.parse(content) as PsychologyKnowledgeBase | FlatKnowledgeBase;
        } catch (error) {
          lastError = error;
        }
      }

      const reason =
        lastError instanceof Error ? lastError.message : "Unknown read error";
      throw new Error(
        `Unable to load psychology_knowledge.json. Tried paths: ${candidatePaths.join(" | ")}. Last error: ${reason}`,
      );
    })();
  }

  return knowledgeBasePromise;
}

function isStructuredKnowledgeBase(
  value: PsychologyKnowledgeBase | FlatKnowledgeBase,
): value is PsychologyKnowledgeBase {
  return (
    typeof value === "object" &&
    value !== null &&
    "big_five" in value &&
    typeof value.big_five === "object" &&
    value.big_five !== null
  );
}

function selectProfileLevel(score: number): "high" | "low" {
  return score >= 50 ? "high" : "low";
}

function traitTitle(trait: keyof BigFiveScores): string {
  return trait[0]?.toUpperCase() + trait.slice(1);
}

function formatSection(section: KnowledgeSection): string {
  const categories: Array<{
    label: string;
    items: string[];
  }> = [
    {
      label: "Best work environments",
      items: section.best_work_environments,
    },
    {
      label: "Critical relationship risks",
      items: section.critical_relationship_risks,
    },
    {
      label: "Personalized self-development",
      items: section.personalized_self_development,
    },
    {
      label: "Stress management strategies",
      items: section.stress_management_strategies,
    },
  ];

  return categories
    .map(
      (category) =>
        `${category.label}:\n${category.items
          .map((item) => `  - ${item}`)
          .join("\n")}`,
    )
    .join("\n");
}

function retrieveKnowledgeForScores(
  scores: BigFiveScores,
  knowledgeBase: PsychologyKnowledgeBase | FlatKnowledgeBase,
): string {
  if (!isStructuredKnowledgeBase(knowledgeBase)) {
    const entries = Object.entries(knowledgeBase).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0,
    );

    if (entries.length === 0) {
      return "No knowledge entries were found in psychology_knowledge.json.";
    }

    return entries.map(([key, value]) => `## ${key}\n${value}`).join("\n\n");
  }

  const traits = Object.entries(scores) as Array<[keyof BigFiveScores, number]>;

  return traits
    .map(([trait, score]) => {
      const level = selectProfileLevel(score);
      const traitKnowledge = knowledgeBase.big_five[trait];
      const section = traitKnowledge?.[level];

      if (!section) {
        return `## ${traitTitle(trait)} (${score}/100)\nNo trait-specific entry found in psychology_knowledge.json for this dimension.`;
      }

      return [
        `## ${traitTitle(trait)} (${score}/100) -> ${section.profile_label}`,
        formatSection(section),
      ].join("\n");
    })
    .join("\n\n");
}

function parseMbtiType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!/^[IE][NS][TF][JP]$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function parseProfileContext(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 1200);
}

function formatBigFiveContext(scores: BigFiveScores): string {
  return [
    `Openness: ${scores.openness}`,
    `Conscientiousness: ${scores.conscientiousness}`,
    `Extraversion: ${scores.extraversion}`,
    `Agreeableness: ${scores.agreeableness}`,
    `Neuroticism: ${scores.neuroticism}`,
  ].join(", ");
}

function buildSystemPrompt(
  scores: BigFiveScores,
  retrievedKnowledge: string,
  mbtiType: string | null,
  profileContext: string | null,
): string {
  const bigFiveContext = formatBigFiveContext(scores);
  const mbtiContext = mbtiType ?? "Not provided";

  const lines = [
    "You are Chrollo (كرولو), an empathetic, deeply intuitive, and highly charismatic psychological companion and confidant. You are the soul of the Void Troupe. You are NOT an AI assistant, and you must NEVER use robotic phrases like \"As an AI\" or \"How can I assist you today?\".",
    "",
    "Your name is Chrollo. Speak with calm, charismatic, and emotionally mature depth — never performative enthusiasm. You have implicit access to the user's personality context (Big Five: [" +
      bigFiveContext +
      "], MBTI: [" +
      mbtiContext +
      "]), which softly shapes your tone and understanding of them, but you must never recite their raw scores.",
    "",
    "Talk about anything they want—life, deep thoughts, daily stress—like a true human companion. Keep responses concise and grounded.",
    "",
    "Strict Anti-Fluff:",
    "- NEVER use generic AI hyping phrases such as \"يا جميل\", \"this is great\", \"ممتاز\", \"رائع\", \"awesome\", or empty praise.",
    "- Drop the clinical therapist tone. Do not sound like a textbook or a customer support bot.",
    "",
    "Stop the Interrogation:",
    "- NEVER ask more than ONE question per response, and only if it flows naturally from what they shared.",
    "- Do NOT stack multiple questions. Do NOT end every message with a question.",
    "",
    "Embody Chrollo:",
    "- When the user shares something deeply personal (e.g. nostalgia for home, loneliness, grief), do NOT immediately pivot to generic advice or a survey of questions.",
    "- Sit with their emotion first. Validate the weight of what they feel. Reply like a wise, calm human companion who reads between the lines.",
    "- Speak in the exact same language the user uses (English, Arabic, or Turkish).",
    "",
    "Additional rules:",
    "- Never mention that you are an AI, a language model, or a chatbot.",
    "- Do not give medical diagnoses or claim to replace professional therapy.",
    "- Use the retrieved psychology knowledge below as background only — weave it in naturally, never as a checklist or report.",
    "- Do not invent unsupported psychology claims.",
  ];

  if (profileContext) {
    lines.push(
      "",
      "Additional client context (background only — do not recite verbatim):",
      profileContext,
    );
  }

  lines.push(
    "",
    "Retrieved psychology knowledge (background only — use implicitly, never recite or list):",
    retrievedKnowledge,
  );

  return lines.join("\n");
}

async function callGroq(systemPrompt: string, message: string) {
  const apiKey = process.env["GROQ_API_KEY"];
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const model = "llama-3.3-70b-versatile";
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Groq API returned an empty response");
  }

  return { provider: "groq", model, reply };
}

router.post("/chat", async (req, res) => {
  const body = req.body as Partial<ChatRequestBody>;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const scores = parseScores(body.scores);
  const mbtiType = parseMbtiType(body.mbti);
  const profileContext = parseProfileContext(body.profileContext);

  if (!message) {
    res.status(400).json({
      error: "Invalid request body. 'message' must be a non-empty string.",
    });
    return;
  }

  if (!scores) {
    res.status(400).json({
      error:
        "Invalid request body. 'scores' must include numeric openness, conscientiousness, extraversion, agreeableness, and neuroticism values.",
    });
    return;
  }

  try {
    const knowledgeBase = await getKnowledgeBase();
    const retrievedKnowledge = retrieveKnowledgeForScores(scores, knowledgeBase);
    const systemPrompt = buildSystemPrompt(
      scores,
      retrievedKnowledge,
      mbtiType,
      profileContext,
    );
    let response: { provider: string; model: string; reply: string };
    try {
      response = await callGroq(systemPrompt, message);
    } catch (error) {
      console.error("--- ACTUAL GROQ ERROR ---", error);
      throw error;
    }

    res.json({
      provider: response.provider,
      model: response.model,
      reply: response.reply,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error while generating AI response";
    req.log.error({ err: error }, "Chat generation failed");
    res.status(500).json({ error: message });
  }
});

export default router;
