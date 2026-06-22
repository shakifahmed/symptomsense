import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type ChatMessage } from "@/data/symptoms";
import { getCurrentLanguage, toDisplayName } from "@/i18n/symptomLang";
import { api, type TriageOutput } from "@/services/api";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, AlertTriangle, RotateCcw, Stethoscope, Loader2, MessageSquare, Star, Send, ExternalLink, Activity, ChevronDown } from "lucide-react";

interface LocationState {
  symptoms: string;
  age: number;
  gender: "Male" | "Female";
  severity: string;
  duration: number;
  symptomLabel: string;
  confirmedSymptoms: string[];
  chatMessages?: ChatMessage[];
  chatParams?: { symptom: string; sex: string; age: string; duration: string };
  cachedPrediction?: TriageOutput;
  cachedFeedbackSent?: boolean;
}

function ConditionCard({ condition, index }: { condition: { name: string; display_name: string; match_percent: number; matched_symptoms: string[] }; index: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const barColor = condition.match_percent >= 50 ? "bg-severity-serious" : condition.match_percent >= 25 ? "bg-amber-400" : "bg-primary";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="rounded-xl border border-border p-3"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3"
      >
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground truncate">{condition.display_name}</span>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {Math.round(condition.match_percent)}% {t("match")}
            </span>
          </div>
          {condition.display_name !== condition.name && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate">{condition.name}</p>
          )}
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${condition.match_percent}%` }} />
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("matched_symptoms_label")}</p>
          <div className="flex flex-wrap gap-1.5">
            {condition.matched_symptoms.map((s) => (
              <span key={s} className="rounded-full bg-chip px-2 py-0.5 text-xs text-chip-foreground">
                {toDisplayName(s)}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

const Results = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as LocationState | null;

  const [prediction, setPrediction] = useState<TriageOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackHover, setFeedbackHover] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(state?.cachedFeedbackSent || false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (feedbackRating === 0 && !feedbackText.trim()) return;
    setFeedbackLoading(true);
    try {
      await api.feedback({
        prediction_id: prediction?.prediction_id,
        rating: feedbackRating || undefined,
        feedback_text: feedbackText.trim() || undefined,
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    if (!state) {
      setLoading(false);
      setError(t("no_data_error"));
      return;
    }

    if (state.cachedPrediction) {
      setPrediction(state.cachedPrediction);
      sessionStorage.setItem("cachedPrediction", JSON.stringify(state.cachedPrediction));
      setLoading(false);
      return;
    }

    const cached = sessionStorage.getItem("cachedPrediction");
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TriageOutput;
        setPrediction(parsed);
        setLoading(false);
        return;
      } catch { /* fall through to fetch */ }
    }

    const fetchPrediction = async () => {
      try {
        const severityMap: Record<string, "Mild" | "Moderate" | "Severe"> = {
          Mild: "Mild",
          Moderate: "Moderate",
          Severe: "Severe",
        };
        const result = await api.predict({
          symptoms: state.symptoms,
          age: state.age,
          gender: state.gender,
          severity: severityMap[state.severity] || "Mild",
          duration: state.duration,
          language: getCurrentLanguage(),
        });
        setPrediction(result);
        sessionStorage.setItem("cachedPrediction", JSON.stringify(result));
      } catch (err) {
        console.error("Predict error:", err);
        setError(t("prediction_error"));
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [state]);

  const getSeverityConfig = (recommendation: string) => {
    if (recommendation === "Doctor Consultation") {
      return {
        icon: AlertCircle,
        label: t("doctor_consultation"),
        className: "text-severity-serious bg-severity-serious/10 border-severity-serious/20",
      };
    }
    return {
      icon: CheckCircle,
      label: t("self_care"),
      className: "text-severity-mild bg-severity-mild/10 border-severity-mild/20",
    };
  };

  return (
    <div className="min-h-screen bg-medical">

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Stethoscope className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-1 text-2xl font-bold text-foreground">{t("your_results")}</h1>
          <p className="text-sm text-muted-foreground">{t("based_on_symptoms")}</p>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center text-xs text-muted-foreground"
        >
          ⚠️ {t("disclaimer")}
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t("analyzing_symptoms")}</p>
          </motion.div>
        )}

        {/* Error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card p-6 text-center shadow-sm"
          >
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-severity-moderate" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </motion.div>
        )}

        {/* Prediction Result */}
        {prediction && !loading && (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-card p-6 shadow-sm"
            >
              {(() => {
                const sev = getSeverityConfig(prediction.recommendation);
                const Icon = sev.icon;
                return (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground">{t("triage_recommendation")}</h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${sev.className}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {sev.label}
                      </span>
                    </div>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                      {prediction.user_explanation}
                    </p>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}

        {/* Possible Conditions */}
        {prediction && !loading && prediction.possible_conditions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 rounded-2xl bg-card p-6 shadow-sm"
          >
            <div className="mb-1 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t("possible_conditions")}</h3>
              <span className="shrink-0 rounded-full border border-amber-400/50 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">Beta</span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">{t("possible_conditions_note")}</p>
            <div className="space-y-3">
              {prediction.possible_conditions.map((condition, idx) => (
                <ConditionCard key={condition.name} condition={condition} index={idx} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Feedback */}
        {prediction && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 rounded-2xl bg-card p-6 shadow-sm"
          >
            {feedbackSent ? (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-2 h-8 w-8 text-severity-mild" />
                <p className="text-sm font-medium text-foreground">{t("feedback_thanks")}</p>
              </div>
            ) : (
              <>
                <h3 className="mb-3 text-center text-sm font-semibold text-foreground">
                  {t("feedback_question")}
                </h3>
                <div className="mb-1 flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      onMouseEnter={() => setFeedbackHover(star)}
                      onMouseLeave={() => setFeedbackHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (feedbackHover || feedbackRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mb-4 text-center text-xs font-medium text-muted-foreground">
                  {(feedbackHover || feedbackRating) === 1 && t("poor")}
                  {(feedbackHover || feedbackRating) === 2 && t("fair")}
                  {(feedbackHover || feedbackRating) === 3 && t("good")}
                  {(feedbackHover || feedbackRating) === 4 && t("very_good")}
                  {(feedbackHover || feedbackRating) === 5 && t("excellent")}
                  {!(feedbackHover || feedbackRating) && " "}
                </p>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={t("feedback_placeholder")}
                  rows={3}
                  className="mb-3 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                />
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackLoading || (feedbackRating === 0 && !feedbackText.trim())}
                  className="w-full rounded-full"
                  size="sm"
                >
                  {feedbackLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  {t("submit_feedback")}
                </Button>
              </>
            )}
          </motion.div>
        )}

        {/* Google Form Feedback */}
        {prediction && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 text-center"
          >
            <a
              href="https://forms.gle/ySHacu3uiDkvFCm2A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4" />
              {t("detailed_feedback")}
            </a>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          {state?.chatMessages && state.chatMessages.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                // Replace current Results entry with cached prediction so browser-back skips re-predict
                navigate("/results", {
                  replace: true,
                  state: { ...state, cachedPrediction: prediction, cachedFeedbackSent: feedbackSent },
                });
                const params = state.chatParams;
                navigate("/chat", {
                  state: {
                    symptom: params?.symptom || "",
                    sex: params?.sex || "",
                    age: params?.age || "25",
                    duration: params?.duration || "1",
                    chatMessages: state.chatMessages,
                  },
                });
              }}
              className="rounded-full px-8 py-6 text-base font-semibold"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {t("view_chat_history")}
            </Button>
          )}
          <Button
            onClick={() => navigate("/")}
            className="rounded-full px-8 py-6 text-base font-semibold"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("start_new_check")}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Results;