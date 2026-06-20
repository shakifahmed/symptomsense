import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toDisplayName } from "@/i18n/symptomLang";
import { X, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SymptomAutocompleteProps {
  symptoms: string[];
  excluded: string[];
  onSubmit: (selected: string[]) => void;
  onSkip: () => void;
}

export function SymptomAutocomplete({ symptoms, excluded, onSubmit, onSkip }: SymptomAutocompleteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const excludedSet = new Set(excluded.map((s) => s.toLowerCase()));
  const selectedSet = new Set(selected.map((s) => s.toLowerCase()));

  const filtered = query.trim().length > 0
    ? symptoms.filter(
        (s) =>
          (s.toLowerCase().includes(query.toLowerCase()) ||
           toDisplayName(s).toLowerCase().includes(query.toLowerCase())) &&
          !excludedSet.has(s.toLowerCase()) &&
          !selectedSet.has(s.toLowerCase())
      ).slice(0, 6)
    : [];

  const addSymptom = useCallback((symptom: string) => {
    setSelected((prev) => [...prev, symptom]);
    setQuery("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const removeSymptom = useCallback((symptom: string) => {
    setSelected((prev) => prev.filter((s) => s !== symptom));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full space-y-2">
      {/* No other symptoms button — top left, hidden when symptoms are selected */}
      {selected.length === 0 && (
        <div className="px-1">
          <button
            onClick={onSkip}
            className="rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            {t("no_other_symptoms")}
          </button>
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {toDisplayName(s).replace(/\b\w/g, (c) => c.toUpperCase())}
              <button
                onClick={() => removeSymptom(s)}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input with suggestions */}
      <div className="relative">
        <AnimatePresence>
          {showSuggestions && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
            >
              {filtered.map((s) => (
                <button
                  key={s}
                  onClick={() => addSymptom(s)}
                  className="w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10 first:rounded-t-xl last:rounded-b-xl"
                >
                  {toDisplayName(s).replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                setShowSuggestions(true);
                setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
              }}
              placeholder={t("search_symptoms")}
              className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
          </div>
          <Button
            onClick={() => onSubmit(selected)}
            disabled={selected.length === 0}
            size="icon"
            className="shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
