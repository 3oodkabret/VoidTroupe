import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  MBTI_OPTIONS,
  getQuestionsForDepth,
  scoreMbti,
  type MbtiDepth,
  type MbtiOptionValue,
} from "@/lib/mbti";
import { useAnalysisStore } from "@/store/use-analysis-store";

type RouteParams = {
  depth?: string;
};

const VALID_DEPTHS: MbtiDepth[] = ["quick", "medium", "accurate"];

export default function MbtiTest(props: { params: RouteParams }) {
  const rawDepth = props.params.depth ?? "quick";
  const depth = VALID_DEPTHS.includes(rawDepth as MbtiDepth)
    ? (rawDepth as MbtiDepth)
    : "quick";

  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { setMbtiResult } = useAnalysisStore();
  const questions = useMemo(() => getQuestionsForDepth(depth), [depth]);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, MbtiOptionValue>>({});

  const currentQuestion = questions[index];
  const answeredCount = Object.keys(answers).length;
  const isLast = index === questions.length - 1;
  const hasCurrentAnswer = answers[currentQuestion.id] !== undefined;

  const onAnswer = (value: MbtiOptionValue) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const onSubmit = () => {
    const result = scoreMbti(depth, answers);
    setMbtiResult(result);
    setLocation("/results");
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-8 md:p-10"
        >
          <h1 className="text-3xl font-display font-bold text-white">{t("mbti.test.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("mbti.test.progress", { current: answeredCount, total: questions.length })}
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6">
            <p className="text-sm uppercase tracking-wider text-white/60">
              {t("ui.common.question")} {index + 1}
            </p>
            <h2 className="text-xl text-white mt-2 leading-relaxed">
              {t(`mbti.questions.${currentQuestion.id}`)}
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {MBTI_OPTIONS.map((option) => {
              const selected = answers[currentQuestion.id] === option.value;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => onAnswer(option.value)}
                  className={`w-full text-left rounded-xl px-5 py-3 border transition-colors ${
                    selected
                      ? "border-primary bg-primary/20 text-white"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {t(`mbti.scale.${option.key}`)}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              disabled={index === 0}
              className="px-5 py-2.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-50"
            >
              {t("ui.common.back")}
            </button>

            {!isLast ? (
              <button
                type="button"
                onClick={() => setIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={!hasCurrentAnswer}
                className="px-6 py-2.5 rounded-lg bg-primary text-black font-semibold disabled:opacity-50"
              >
                {t("ui.common.next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={answeredCount < questions.length}
                className="px-6 py-2.5 rounded-lg bg-primary text-black font-semibold disabled:opacity-50"
              >
                {t("ui.common.finish")}
              </button>
            )}
          </div>

          {isLast && answeredCount < questions.length && (
            <p className="mt-4 text-sm text-muted-foreground">{t("mbti.test.completion")}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
