import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import type { BatchQuestion } from "@/services/api";

interface LikertBatchFormProps {
  questions: BatchQuestion[];
  answers: Record<string, "yes" | "no" | "unsure">;
  onAnswerChange: (symptom: string, answer: "yes" | "no" | "unsure") => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function LikertBatchForm({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  disabled,
}: LikertBatchFormProps) {
  const { t } = useTranslation();
  const ANSWER_OPTIONS = [
    { value: "yes" as const, label: t("yes") },
    { value: "no" as const, label: t("no") },
    { value: "unsure" as const, label: t("not_sure") },
  ];
  const allAnswered = questions.every((q) => answers[q.symptom] !== undefined);

  return (
    <div className="w-full rounded-2xl p-4" style={{ backgroundColor: "var(--bot-bubble)" }}>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <motion.div
            key={q.symptom}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl bg-white/70 p-3"
          >
            <p className="mb-2.5 text-sm font-medium text-foreground">{q.question_text}</p>
            <div className="flex items-center gap-5">
              {ANSWER_OPTIONS.map(({ value, label }) => {
                const isSelected = answers[q.symptom] === value;
                return (
                  <button
                    key={value}
                    onClick={() => !disabled && onAnswerChange(q.symptom, value)}
                    disabled={disabled}
                    className={`flex items-center gap-2 ${
                      disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    <span
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/40 bg-white"
                      }`}
                    >
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isSelected ? "text-primary" : "text-foreground/70"
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
      {!disabled && (
        <Button
          onClick={onSubmit}
          disabled={!allAnswered}
          className="mt-4 w-full rounded-full"
          size="sm"
        >
          {t("submit_answers")}
        </Button>
      )}
    </div>
  );
}
