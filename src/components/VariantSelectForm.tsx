import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toDisplayName } from "@/i18n/symptomLang";
import { Button } from "@/components/ui/button";

interface VariantSelectFormProps {
  questionText: string;
  options: string[];
  onSubmit: (selected: string[]) => void;
  disabled?: boolean;
  savedSelections?: string[];
}

export function VariantSelectForm({
  questionText,
  options,
  onSubmit,
  disabled,
  savedSelections,
}: VariantSelectFormProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(new Set(savedSelections || []));
  const [noneSelected, setNoneSelected] = useState(disabled && savedSelections?.length === 0 ? true : false);

  const toggle = (option: string) => {
    if (disabled) return;
    setNoneSelected(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(option)) next.delete(option);
      else next.add(option);
      return next;
    });
  };

  const toggleNone = () => {
    if (disabled) return;
    setNoneSelected((prev) => !prev);
    setSelected(new Set());
  };

  const canSubmit = !disabled && (noneSelected || selected.size > 0);

  return (
    <div className="w-full rounded-2xl p-4" style={{ backgroundColor: "var(--bot-bubble)" }}>
      <p className="mb-3 text-sm font-medium text-foreground">{questionText}</p>
      <div className="space-y-2">
        {options.map((option, i) => {
          const label = toDisplayName(option).replace(/\b\w/g, (c) => c.toUpperCase());
          const isSelected = selected.has(option);
          return (
            <motion.button
              key={option}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => toggle(option)}
              disabled={disabled}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white/70 text-foreground hover:bg-white/90"
              } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                  isSelected
                    ? "border-primary-foreground bg-primary-foreground/20"
                    : "border-muted-foreground/40"
                }`}
              >
                {isSelected && (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
              {label}
            </motion.button>
          );
        })}

        <motion.button
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: options.length * 0.05 }}
          onClick={toggleNone}
          disabled={disabled}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all ${
            noneSelected
              ? "bg-muted text-foreground shadow-sm"
              : "bg-white/70 text-muted-foreground hover:bg-white/90"
          } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
              noneSelected
                ? "border-foreground bg-foreground/20"
                : "border-muted-foreground/40"
            }`}
          >
            {noneSelected && (
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
          {t("none_of_above")}
        </motion.button>
      </div>

      {!disabled && (
        <Button
          onClick={() => onSubmit(noneSelected ? [] : Array.from(selected))}
          disabled={!canSubmit}
          className="mt-4 w-full rounded-full"
          size="sm"
        >
          {t("submit")}
        </Button>
      )}
    </div>
  );
}
