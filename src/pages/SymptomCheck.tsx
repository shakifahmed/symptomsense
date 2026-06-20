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
import { loadSymptoms, nameToId, idToName, commonSymptomNames } from "@/data/symptoms";
import { toDisplayName } from "@/i18n/symptomLang";

const EN_DIGITS = "0123456789";
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toBnDigits = (s: string) => s.replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
const toEnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => EN_DIGITS[BN_DIGITS.indexOf(d)]);

const SymptomCheck = () => {
  const location = useLocation();
  const preselectedSymptom = (location.state as { symptom?: string } | null)?.symptom || null;
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const hasPreselected = !!preselectedSymptom;
  const TOTAL_STEPS = hasPreselected ? 3 : 4;

  const [step, setStep] = useState(1);
  const [sex, setSex] = useState("");
  const [age, setAge] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(preselectedSymptom ? preselectedSymptom.split(",") : []);
  const [symptomSearch, setSymptomSearch] = useState("");
  const [duration, setDuration] = useState("");
  const [allSymptoms, setAllSymptoms] = useState<string[]>([]);

  useEffect(() => {
    loadSymptoms().then(setAllSymptoms);
  }, []);

  const progress = (step / TOTAL_STEPS) * 100;

  const isSymptomStep = !hasPreselected && step === 3;
  const isDurationStep = hasPreselected ? step === 3 : step === 4;

  const filteredSymptoms = symptomSearch.trim()
    ? allSymptoms.filter((s) =>
        s.toLowerCase().includes(symptomSearch.toLowerCase()) ||
        toDisplayName(s).toLowerCase().includes(symptomSearch.toLowerCase())
      )
    : [...allSymptoms].sort((a, b) => {
        const aCommon = commonSymptomNames.has(a) ? 0 : 1;
        const bCommon = commonSymptomNames.has(b) ? 0 : 1;
        return aCommon - bCommon;
      });

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const canProceed = () => {
    if (step === 1) return sex !== "";
    if (step === 2) return age !== "" && Number(age) > 0;
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
      navigate("/chat", { state: { symptom: symptoms, sex, age, duration } });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate("/");
  };

  return (
    <div
      className="min-h-screen bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/check.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="mx-auto max-w-lg px-4 py-6">
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
            className="rounded-2xl bg-card p-6 shadow-sm"
          >
            {step === 1 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t("sex_question")}
                </h2>
                <p className="mb-6 text-xs text-muted-foreground">
                  {t("sex_note")}
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

            {step === 2 && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t("age_question")}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t("age_note")}
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("enter_age")}
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
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t("symptom_question")}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("symptom_note")}
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
                <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-2">
                  <div className="flex flex-wrap gap-2">
                    {filteredSymptoms.slice(0, 100).map((name) => {
                      const id = nameToId(name);
                      return (
                        <button
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
                    {filteredSymptoms.length > 100 && (
                      <p className="w-full text-center text-xs text-muted-foreground py-1">
                        {t("type_to_search", { count: filteredSymptoms.length - 100 })}
                      </p>
                    )}
                    {filteredSymptoms.length === 0 && (
                      <p className="w-full text-center text-xs text-muted-foreground py-2">
                        {t("no_symptoms_found")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isDurationStep && (
              <div>
                <h2 className="mb-2 text-xl font-bold text-foreground">
                  {t("duration_question")}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t("duration_note")}
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t("number_of_days")}
                  value={isBn ? toBnDigits(duration) : duration}
                  onChange={(e) => {
                    const raw = toEnDigits(e.target.value).replace(/[^0-9]/g, "");
                    setDuration(raw);
                  }}
                  className="rounded-xl text-center text-lg"
                />
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="mt-6 w-full rounded-full py-6 text-base font-semibold"
            >
              {step === TOTAL_STEPS ? t("start_chat") : t("next")}
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SymptomCheck;
