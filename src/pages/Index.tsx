import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { quickSymptomNames, nameToId } from "@/data/symptoms";
import { toDisplayName } from "@/i18n/symptomLang";
import { motion } from "framer-motion";
import { Stethoscope, Clock, Shield, Search } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSymptomClick = (symptomId: string) => {
    navigate(`/check?symptom=${symptomId}`);
  };

  return (
    <div
      className="min-h-screen bg-lavender"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), url('/home.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-2xl px-4 pb-12 pt-16 text-center sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex h-230 w-40 items-center justify-center rounded-3xl bg-card shadow-lg">
              <Stethoscope className="h-20 w-20 text-primary" />
            </div>

            <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              {t("app_name")}
            </h1>

            <p className="mb-8 text-base text-black-foreground sm:text-lg">
              {t("tagline")}
            </p>

            <div className="mb-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-primary" /> {t("free")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-primary" /> {t("just_3_minutes")}
              </span>
            </div>

            <Button
              size="lg"
              className="mb-8 rounded-full px-10 py-6 text-lg font-semibold shadow-lg shadow-primary/25"
              onClick={() => navigate("/check")}
            >
              {t("start_symptom_check")}
            </Button>
          </motion.div>

          {/* Quick Symptom Chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              {t("or_choose_symptom")}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {quickSymptomNames.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSymptomClick(nameToId(name))}
                  className="inline-flex items-center gap-1.5 rounded-full bg-chip px-4 py-2 text-sm font-medium text-chip-foreground transition-all hover:bg-primary/15 hover:shadow-sm"
                >
                  {toDisplayName(name)}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Browse Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <button
              onClick={() => navigate("/browse")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Search className="h-4 w-4" />
              {t("find_other_symptoms")}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Index;