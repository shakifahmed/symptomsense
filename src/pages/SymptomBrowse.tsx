import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loadSymptoms, nameToId, idToName, chiefComplaintNames, chiefComplaintCategories } from "@/data/symptoms";
import { toDisplayName, localizeDigits } from "@/i18n/symptomLang";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { ArrowLeft, Search, X } from "lucide-react";
import { motion } from "framer-motion";

const SymptomBrowse = () => {
  const [search, setSearch] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    loadSymptoms().then(setAllSymptoms);
  }, []);

  const chiefComplaints = allSymptoms.filter((s) => chiefComplaintNames.has(s));

  const isSearching = search.trim().length > 0;

  const searchResults = isSearching
    ? chiefComplaints.filter((s) =>
        s.toLowerCase().includes(search.toLowerCase()) ||
        toDisplayName(s).toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    sessionStorage.removeItem("cachedPrediction");
    navigate("/check", { state: { symptom: selectedSymptoms.join(",") } });
  };

  return (
    <div className="min-h-screen bg-medical">

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">{t("find_a_symptom")}</h1>
        </div>

        {/* Selected symptoms */}
        {selectedSymptoms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {selectedSymptoms.map((id) => (
              <div
                key={id}
                className="flex items-center gap-1.5 rounded-full border-2 border-primary bg-primary/5 px-3 py-1.5"
              >
                <span className="text-xs font-medium text-foreground">
                  {toDisplayName(idToName(id, allSymptoms))}
                </span>
                <button
                  onClick={() => toggleSymptom(id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {/* Continue button */}
        {selectedSymptoms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Button
              onClick={handleContinue}
              className="w-full rounded-full py-6 text-base font-semibold"
            >
              {selectedSymptoms.length > 1
                ? t("continue_with_plural", { count: localizeDigits(selectedSymptoms.length) })
                : t("continue_with", { count: localizeDigits(selectedSymptoms.length) })}
            </Button>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search_symptoms")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-full bg-card pl-10 shadow-sm"
            />
          </div>
        </motion.div>

        {/* Search results (flat) */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-4 shadow-sm"
          >
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {searchResults.map((name) => {
                  const id = nameToId(name);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleSymptom(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedSymptoms.includes(id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-chip text-chip-foreground hover:bg-primary/15"
                      }`}
                    >
                      {toDisplayName(name)}
                    </button>
                  );
                })}
                {searchResults.length === 0 && (
                  <p className="w-full text-center text-sm text-muted-foreground py-4">
                    {t("no_symptoms_found")}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Categorized dropdown view (default) */}
        {!isSearching && (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {chiefComplaintCategories.map((cat) => (
              <CategoryDropdown
                key={cat.key}
                categoryKey={cat.key}
                symptoms={cat.symptoms}
                allSymptoms={allSymptoms}
                selectedSymptoms={selectedSymptoms}
                onToggle={toggleSymptom}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SymptomBrowse;
