import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useAnalysisStore } from "@/store/use-analysis-store";
import { withApiBase } from "@/lib/api-base";
import { ArrowLeft, Share2, BrainCircuit, Send, Loader2, MessageCircle, Minus, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const DEFAULT_SCORES = {
  openness: 50,
  conscientiousness: 50,
  extraversion: 50,
  agreeableness: 50,
  neuroticism: 50,
};

export default function Results() {
  const { t } = useTranslation();
  const { currentResult, mbtiResult } = useAnalysisStore();
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const mbtiCode = mbtiResult?.code ?? null;
  const initialChatIntro = useMemo(
    () =>
      mbtiCode
        ? t("results.chat.introWithMbti", { mbti: mbtiCode })
        : t("results.chat.introNoMbti"),
    [mbtiCode, t],
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => [
    {
      id: "intro",
      role: "assistant",
      text: initialChatIntro,
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.id !== "intro") {
        return prev;
      }

      return [{ ...prev[0], text: initialChatIntro }];
    });
  }, [initialChatIntro]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages, isSending]);

  const activeScores = currentResult?.scores ?? DEFAULT_SCORES;
  const insightSummary =
    currentResult?.summary?.trim() || t("results.summary.fallback");

  const chartData = useMemo(() => {
    const s = activeScores;
    return [
      {
        subject: t("traits.openness"),
        label: t("results.radarLabels.openness"),
        value: s.openness,
        fullMark: 100,
      },
      {
        subject: t("traits.conscientiousness"),
        label: t("results.radarLabels.conscientiousness"),
        value: s.conscientiousness,
        fullMark: 100,
      },
      {
        subject: t("traits.extraversion"),
        label: t("results.radarLabels.extraversion"),
        value: s.extraversion,
        fullMark: 100,
      },
      {
        subject: t("traits.agreeableness"),
        label: t("results.radarLabels.agreeableness"),
        value: s.agreeableness,
        fullMark: 100,
      },
      {
        subject: t("traits.neuroticism"),
        label: t("results.radarLabels.neuroticism"),
        value: s.neuroticism,
        fullMark: 100,
      },
    ];
  }, [activeScores, t]);

  const profileContext = useMemo(() => {
    return [
      `User Profile: Big Five [Openness: ${Math.round(activeScores.openness)}, Conscientiousness: ${Math.round(activeScores.conscientiousness)}, Extraversion: ${Math.round(activeScores.extraversion)}, Agreeableness: ${Math.round(activeScores.agreeableness)}, Neuroticism: ${Math.round(activeScores.neuroticism)}], MBTI: ${mbtiCode ?? "Unknown"}. Please analyze both.`,
    ].join("\n");
  }, [activeScores, mbtiCode]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSending) return;

    const message = chatInput.trim();
    if (!message) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      text: message,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatError(null);
    setIsSending(true);

    try {
      const response = await fetch(withApiBase("/api/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          scores: activeScores,
          mbti: mbtiCode,
          profileContext,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || t("results.chat.fetchError"));
      }

      const reply = data.reply?.trim();
      if (!reply) {
        throw new Error(t("results.chat.emptyResponseError"));
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          text: reply,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("results.chat.unexpectedError");
      setChatError(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto pt-24 pb-20 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12"
        >
          <div>
            <Link href="/analyze" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> {t("results.page.backToVoid")}
            </Link>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white flex items-center gap-3">
              <BrainCircuit className="w-10 h-10 text-primary" />
              {t("results.page.title")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {currentResult
                ? t("results.page.wordCountDescription", {
                    count: currentResult.wordCount,
                  })
                : t("results.page.noAnalysisFallback")}
            </p>
          </div>

          <button className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 transition-all hover:box-glow cursor-pointer">
            <Share2 className="w-4 h-4" />
            {t("results.page.shareButton")}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="flex flex-col gap-8">
            {/* Radar Chart Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-3xl p-6 md:p-10 flex flex-col items-center justify-center min-h-[520px] relative overflow-hidden"
            >
              <div className="absolute w-[200%] h-[200%] bg-primary/5 blur-[100px] rounded-full z-0" />
              
              <h3 className="text-xl font-bold mb-6 relative z-10 w-full text-center tracking-widest text-white/80 uppercase">{t("results.page.dimensionalWebTitle")}</h3>
              
              <div className="w-full max-w-2xl h-[440px] md:h-[480px] relative z-10 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="52%"
                    data={chartData}
                    margin={{ top: 48, right: 96, bottom: 48, left: 96 }}
                  >
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    />
                    <RechartsTooltip
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.subject ?? ""}
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      itemStyle={{ color: "hsl(var(--primary))" }}
                    />
                    <Radar 
                      name={t("results.page.yourScore")} 
                      dataKey="value" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.4} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* LLM Summary — psychological conclusion before Chrollo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="relative rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md p-4 md:p-6 shadow-[0_0_40px_rgba(168,85,247,0.08)] mb-2"
            >
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-primary/5" />
              <div className="relative flex items-start gap-4">
                <div className="mt-0.5 shrink-0 w-10 h-10 rounded-full bg-primary/15 border border-purple-500/30 flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.2)]">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/80 font-semibold mb-2">
                    {t("results.summary.title")}
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-white/90">
                    {insightSummary}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bar Charts Section */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-6"
            >
              {mbtiResult && (
                <div className="glass-panel p-5 rounded-2xl border border-primary/30 bg-primary/10">
                  <h4 className="font-display font-bold text-lg">{t("results.mbtiSectionTitle")}</h4>
                  <p className="text-primary font-semibold mt-1">
                    {t("mbti.result.code", { code: mbtiResult.code })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("mbti.result.depth", { depth: mbtiResult.depth })}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-white/70">{t("mbti.result.dimensions.EI")}</p>
                      <p className="font-mono text-primary mt-1">{mbtiResult.scores.EI}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-white/70">{t("mbti.result.dimensions.SN")}</p>
                      <p className="font-mono text-primary mt-1">{mbtiResult.scores.SN}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-white/70">{t("mbti.result.dimensions.TF")}</p>
                      <p className="font-mono text-primary mt-1">{mbtiResult.scores.TF}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-white/70">{t("mbti.result.dimensions.JP")}</p>
                      <p className="font-mono text-primary mt-1">{mbtiResult.scores.JP}</p>
                    </div>
                  </div>
                </div>
              )}

              {chartData.map((item, index) => (
                <div key={item.subject} className="glass-panel p-5 rounded-2xl flex items-center gap-6 group hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <h4 className="font-display font-bold text-lg">{item.subject}</h4>
                      <span className="font-mono text-primary font-bold">{Math.round(item.value)}%</span>
                    </div>
                    
                    <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, delay: 0.5 + (index * 0.1), ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary/50 to-primary relative"
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      {isChatMinimized ? (
        <button
          type="button"
          onClick={() => setIsChatMinimized(false)}
          aria-label={t("results.chat.restoreAriaLabel")}
          className="fixed bottom-6 right-6 z-[9999] h-14 w-14 rounded-full bg-primary/90 hover:bg-primary text-black shadow-[0_0_24px_rgba(168,85,247,0.45)] border border-purple-300/40 flex items-center justify-center transition-all hover:scale-105"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="fixed bottom-6 right-6 w-96 h-[550px] z-[9999] bg-[#0a0a0a] border border-purple-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-black/40 flex items-center justify-between gap-3">
            <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-white/80">{t("chat.name")}</h3>
            <button
              type="button"
              onClick={() => setIsChatMinimized(true)}
              aria-label={t("results.chat.minimizeAriaLabel")}
              className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20"
          >
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "ml-auto bg-primary/20 border border-primary/40 text-white"
                    : "mr-auto bg-white/5 border border-white/10 text-white/90"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {isSending && (
              <div className="mr-auto max-w-[92%] rounded-2xl px-4 py-3 text-sm border border-white/10 bg-white/5 text-white/80 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {t("results.chat.thinking")}
              </div>
            )}
          </div>

          {chatError && (
            <p className="mx-4 mt-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {chatError}
            </p>
          )}

          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/40 flex items-center gap-3">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t("results.chat.inputPlaceholder")}
              className="flex-1 h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !chatInput.trim()}
              className="h-11 px-4 rounded-xl bg-primary/80 hover:bg-primary text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("results.chat.sendButton")}
            </button>
          </form>
        </div>
      )}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
