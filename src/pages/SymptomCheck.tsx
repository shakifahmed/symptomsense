import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, X, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { loadSymptoms, nameToId, idToName, chiefComplaintNames, chiefComplaintCategories } from "@/data/symptoms";
import { toDisplayName, toBnDigits, toEnDigits } from "@/i18n/symptomLang";
import { CategoryDropdown } from "@/components/CategoryDropdown";

const SymptomCheck = () => {
  const location = useLocation();
  const preselectedSymptom = (location.state as { symptom?: string } | null)?.symptom || null;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const hasPreselected = !!preselectedSymptom;

  const [step, setStep] = useState(1);
  const [checkFor, setCheckFor] = useState("");
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(preselectedSymptom ? preselectedSymptom.split(",") : []);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [duration, setDuration] = useState("");
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);

  useEffect(() => {
    loadSymptoms().then(setAllSymptoms);
  }, []);

  const TOTAL_STEPS = hasPreselected ? 4 : 5;

  const progress = (step / TOTAL_STEPS) * 100;

  const isSexStep = step === 2;
  const isAgeStep = step === 3;
  const isSymptomStep = !hasPreselected && step === 4;
  const isDurationStep = hasPreselected ? step === 4 : step === 5;

  const ctxSuffix = checkFor === "child" ? "_child" : checkFor === "self" ? "_self" : "_patient";

  const chiefComplaints = allSymptoms.filter((s) => chiefComplaintNames.has(s));
  const isSearching = symptomSearch.trim().length > 0;

  const searchResults = isSearching
    ? chiefComplaints.filter((s) =>
        s.toLowerCase().includes(symptomSearch.toLowerCase()) ||
        toDisplayName(s).toLowerCase().includes(symptomSearch.toLowerCase())
      )
    : [];

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 1) return checkFor !== "";
    if (isSexStep) return sex !== "";
    if (isAgeStep) return age !== "" && Number(age) > 0;
    if (isSymptomStep) return selectedSymptoms.length > 0;
    if (isDurationStep) return duration !== "" && Number(duration) > 0;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      sessionStorage.removeItem("cachedPrediction");
      const symptoms = selectedSymptoms.length > 0 ? selectedSymptoms.join(",") : "headache";
      navigate("/chat", { state: { symptom: symptoms, sex, age, duration, checkFor } });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate("/");
  };

  return (
    <div className="flex h-dvh flex-col bg-medical">

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col overflow-hidden px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {t("step_of", { step: isBn ? toBnDigits(String(step)) : step, total: isBn ? toBnDigits(String(TOTAL_STEPS)) : TOTAL_STEPS })}
          </span>
          <button
            onClick={() => navigate("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:bg-secondary"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <Progress value={progress} className="mb-8 h-2" />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex min-h-0 flex-1 flex-col rounded-2xl bg-card p-6 shadow-sm"
          >
            <form
              onSubmit={(e) => { e.preventDefault(); if (canProceed()) handleNext(); }}
              onKeyDown={(e) => { if (e.key === "Enter" && canProceed()) { e.preventDefault(); handleNext(); } }}
              className="flex min-h-0 flex-1 flex-col"
            >
            {step === 1 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t("check_for_question")}
                </h2>
                <p className="mb-6 text-xs text-muted-foreground">
                  {t("check_for_note")}
                </p>
                <RadioGroup value={checkFor} onValueChange={setCheckFor} className="space-y-2">
                  {[
                    { value: "self", label: t("check_for_self") },
                    { value: "spouse", label: t("check_for_spouse") },
                    { value: "child", label: t("check_for_child") },
                    { value: "parent", label: t("check_for_parent") },
                    { value: "other", label: t("check_for_other") },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`check-${option.value}`}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                        checkFor === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={`check-${option.value}`} />
                      <span className="text-sm font-medium">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {isSexStep && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t(`sex_question${ctxSuffix}`)}
                </h2>
                <p className="mb-6 text-xs text-muted-foreground">
                  {t(`sex_note${ctxSuffix}`)}
                </p>
                <RadioGroup value={sex} onValueChange={setSex} className="space-y-3">
                  {[
                    { value: "male", label: t("male") },
                    { value: "female", label: t("female") },
                  ].map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        sex === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {isAgeStep && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t(`age_question${ctxSuffix}`)}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t(`age_note${ctxSuffix}`)}
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t(`enter_age_placeholder${ctxSuffix}`)}
                  value={isBn ? toBnDigits(age) : age}
                  onChange={(e) => {
                    const raw = toEnDigits(e.target.value).replace(/[^0-9]/g, "");
                    if (raw === "" || (Number(raw) >= 0 && Number(raw) <= 120)) setAge(raw);
                  }}
                  className="rounded-xl text-center text-lg"
                />
              </div>
            )}

            {isSymptomStep && (
              <div className="flex min-h-0 flex-1 flex-col">
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t(`symptom_question${ctxSuffix}`)}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t(`symptom_note${ctxSuffix}`)}
                </p>
                {selectedSymptoms.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedSymptoms.map((id) => (
                      <div
                        key={id}
                        className="flex items-center gap-1.5 rounded-full border-2 border-primary bg-primary/5 px-3 py-1.5"
                      >
                        <span className="text-xs font-medium text-foreground">
                          {toDisplayName(idToName(id, allSymptoms))}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSymptom(id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("search_symptoms")}
                    value={symptomSearch}
                    onChange={(e) => setSymptomSearch(e.target.value)}
                    className="rounded-full pl-10"
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border p-2">
                  {isSearching ? (
                    <div className="flex flex-wrap gap-2">
                      {searchResults.map((name) => {
                        const id = nameToId(name);
                        return (
                          <button
                            type="button"
                            key={id}
                            onClick={() => toggleSymptom(id)}
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
                      {searchResults.length === 0 && (
                        <p className="w-full text-center text-xs text-muted-foreground py-2">
                          {t("no_symptoms_found")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {chiefComplaintCategories.map((cat) => (
                        <CategoryDropdown
                          key={cat.key}
                          categoryKey={cat.key}
                          symptoms={cat.symptoms}
                          allSymptoms={allSymptoms}
                          selectedSymptoms={selectedSymptoms}
                          onToggle={toggleSymptom}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {isDurationStep && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t(`duration_question${ctxSuffix}`)}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t(`duration_note${ctxSuffix}`)}
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("number_of_days_placeholder")}
                  value={isBn ? toBnDigits(duration) : duration}
                  onChange={(e) => {
                    const raw = toEnDigits(e.target.value).replace(/[^0-9]/g, "");
                    if (raw === "" || (Number(raw) >= 0 && Number(raw) <= 365)) setDuration(raw);
                  }}
                  className="rounded-xl text-center text-lg"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={!canProceed()}
              className="mt-auto w-full shrink-0 rounded-full py-6 text-base font-semibold"
            >
              {step === TOTAL_STEPS ? t("start_chat") : t("next")}
            </Button>
            </form>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SymptomCheck;
