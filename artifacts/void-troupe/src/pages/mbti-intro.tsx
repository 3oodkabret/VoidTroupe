import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { MbtiDepth } from "@/lib/mbti";

const DEPTHS: MbtiDepth[] = ["quick", "medium", "accurate"];

export default function MbtiIntro() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [selectedDepth, setSelectedDepth] = useState<MbtiDepth>("quick");

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 md:p-10"
        >
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
            {t("mbti.intro.title")}
          </h1>
          <p className="text-muted-foreground mt-3">{t("mbti.intro.description")}</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEPTHS.map((depth) => {
              const isActive = selectedDepth === depth;
              return (
                <button
                  key={depth}
                  type="button"
                  onClick={() => setSelectedDepth(depth)}
                  className={`text-left rounded-2xl p-5 border transition-all ${
                    isActive
                      ? "border-primary bg-primary/20"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <h2 className="text-base font-semibold text-white">
                    {t(`mbti.intro.${depth}.title`)}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t(`mbti.intro.${depth}.description`)}
                  </p>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setLocation(`/mbti/test/${selectedDepth}`)}
            className="mt-8 px-7 py-3 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform"
          >
            {t("mbti.intro.start")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
