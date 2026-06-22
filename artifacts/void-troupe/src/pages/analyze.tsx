import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAnalyzePersonality } from "@workspace/api-client-react";
import { useAnalysisStore } from "@/store/use-analysis-store";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const MIN_WORDS = 50;

export default function Analyze() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [text, setText] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { setResult } = useAnalysisStore();
  
  const { mutate, isPending, error } = useAnalyzePersonality({
    mutation: {
      onSuccess: (data) => {
        if (!data?.scores) {
          setSubmitError(
            t("analyze.page.invalidApiResponse"),
          );
          return;
        }
        setSubmitError(null);
        setResult(data);
        setLocation("/results");
      }
    },
  });

  const wordCount = useMemo(() => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [text]);

  const progress = Math.min((wordCount / MIN_WORDS) * 100, 100);
  const isValid = wordCount >= MIN_WORDS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isPending) return;
    setSubmitError(null);
    mutate({ data: { text } });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{t("analyze.page.title")}</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("analyze.page.description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className={`absolute -inset-0.5 rounded-2xl blur-lg transition-all duration-500 opacity-0 group-focus-within:opacity-100 ${isValid ? 'bg-primary/50' : 'bg-destructive/30'}`} />
            
            <div className="relative glass-panel rounded-2xl p-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("analyze.page.placeholder")}
                className="w-full h-80 bg-black/40 rounded-xl p-6 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
                disabled={isPending}
              />
              
              <div className="absolute bottom-4 right-6 flex items-center gap-4">
                <span className={`text-sm font-mono transition-colors ${isValid ? 'text-primary' : 'text-muted-foreground'}`}>
                  {t("analyze.page.wordCounter", { current: wordCount, minimum: MIN_WORDS })}
                </span>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isValid ? 'bg-primary' : 'bg-muted-foreground'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {(error || submitError) && (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 p-4 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{submitError || error?.message || t("analyze.page.genericError")}</p>
            </div>
          )}

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={!isValid || isPending}
              className={`
                relative px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all duration-300
                ${isValid 
                  ? 'bg-white text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] cursor-pointer' 
                  : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}
              `}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t("analyze.page.analyzing")}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t("analyze.page.submit")}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
