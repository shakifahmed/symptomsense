import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { nameToId } from "@/data/symptoms";
import { toDisplayName, localizeDigits } from "@/i18n/symptomLang";

interface CategoryDropdownProps {
  categoryKey: string;
  symptoms: string[];
  allSymptoms: string[];
  selectedSymptoms: string[];
  onToggle: (id: string) => void;
  compact?: boolean;
}

export function CategoryDropdown({
  categoryKey,
  symptoms,
  allSymptoms,
  selectedSymptoms,
  onToggle,
  compact = false,
}: CategoryDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const available = symptoms.filter((s) => allSymptoms.some((a) => a === s));
  if (available.length === 0) return null;

  const selectedCount = available.filter((s) => selectedSymptoms.includes(nameToId(s))).length;

  return (
    <div className={compact ? "" : "rounded-2xl bg-primary/10 shadow-sm overflow-hidden"}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between ${
          compact
            ? "py-2 px-1"
            : "px-4 py-3"
        } text-left transition-colors hover:bg-secondary/50`}
      >
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${compact ? "text-xs" : "text-sm"} text-foreground`}>
            {t(categoryKey)}
          </span>
          {selectedCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
              {localizeDigits(selectedCount)}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`flex flex-wrap gap-1.5 ${compact ? "px-1 pb-2" : "px-4 pb-3"}`}>
              {available.map((name) => {
                const id = nameToId(name);
                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => onToggle(id)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedSymptoms.includes(id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-chip text-chip-foreground hover:bg-primary/15"
                    }`}
                  >
                    {toDisplayName(name)}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
