import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useAnalysisStore } from "@/store/use-analysis-store";
import { ArrowLeft, Share2, BrainCircuit, Send, Loader2, Sparkles } from "lucide-react";

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
  const { currentResult } = useAnalysisStore();
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "I'm here to explain your profile and help with practical next steps. Ask me anything about your Big Five results.",
    },
  ]);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages, isSending]);

  const activeScores = currentResult?.scores ?? DEFAULT_SCORES;
  const insightSummary = currentResult?.summary?.trim()
    || "Your words reveal someone carrying real depth beneath the surface — thoughtful, emotionally aware, and quietly searching for clarity. There is strength in how honestly you express yourself, even when the feeling is heavy.";
  const apiBaseUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

  const chartData = useMemo(() => {
    const s = activeScores;
    return [
      { subject: "Openness", value: s.openness, fullMark: 100 },
      { subject: "Conscientiousness", value: s.conscientiousness, fullMark: 100 },
      { subject: "Extraversion", value: s.extraversion, fullMark: 100 },
      { subject: "Agreeableness", value: s.agreeableness, fullMark: 100 },
      { subject: "Neuroticism", value: s.neuroticism, fullMark: 100 },
    ];
  }, [activeScores]);

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
      const response = await fetch(apiBaseUrl ? `${apiBaseUrl}/api/chat` : "/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          scores: activeScores,
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch chat response");
      }

      const reply = data.reply?.trim();
      if (!reply) {
        throw new Error("The assistant returned an empty response.");
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
          : "Unexpected error while sending chat message.";
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
              <ArrowLeft className="w-4 h-4" /> Back to Void
            </Link>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white flex items-center gap-3">
              <BrainCircuit className="w-10 h-10 text-primary" />
              Your Psyche Map
            </h1>
            <p className="text-muted-foreground mt-2">
              {currentResult
                ? `Based on your submission of ${currentResult.wordCount} words.`
                : "No analysis loaded yet. Chat is available with balanced default scores."}
            </p>
          </div>

          <button className="px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 transition-all hover:box-glow cursor-pointer">
            <Share2 className="w-4 h-4" />
            Share Result
          </button>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="flex flex-col gap-8">
            {/* Radar Chart Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden"
            >
              <div className="absolute w-[200%] h-[200%] bg-primary/5 blur-[100px] rounded-full z-0" />

              <h3 className="text-xl font-bold mb-8 relative z-10 w-full text-center tracking-widest text-white/80 uppercase">Dimensional Web</h3>

              <div className="w-full h-[320px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "var(--font-mono)" }}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(0,0,0,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }}
                      itemStyle={{ color: "hsl(var(--primary))" }}
                    />
                    <Radar
                      name="Your Score"
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

            {/* LLM Summary Section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="relative rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-md p-4 md:p-6 shadow-[0_0_40px_rgba(168,85,247,0.08)] mb-2"
            >
              <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/5 via-transparent to-primary/5" />
              <div className="relative flex items-start gap-4">
                <div className="mt-0.5 shrink-0 w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-[0_0_18px_hsla(var(--primary)/0.35)]">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary/90 font-semibold mb-2">
                    AI Insight
                  </p>
                  <p className="text-base md:text-lg leading-relaxed text-white/95">
                    {insightSummary}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Chat Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="w-full min-h-[540px] bg-[#0a0a0a]/95 border border-purple-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden mt-2"
            >
              <div className="px-5 py-4 border-b border-white/10 bg-black/40">
                <h3 className="text-sm font-mono uppercase tracking-[0.2em] text-white/80">Chrollo</h3>
              </div>

              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20 min-h-[360px]"
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
                    Thinking...
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
                  placeholder="Ask about your personality profile..."
                  className="flex-1 h-11 rounded-xl border border-white/10 bg-black/40 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-primary/60"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !chatInput.trim()}
                  className="h-11 px-4 rounded-xl bg-primary/80 hover:bg-primary text-black font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </form>
            </motion.div>

            {/* Trait Breakdown Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-6"
            >
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
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
