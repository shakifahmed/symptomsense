import { useTranslation } from "react-i18next";

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  const toggle = () => {
    const next = isBn ? "en" : "bn";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button
      onClick={toggle}
      className="fixed right-4 top-4 z-50 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors hover:bg-secondary"
    >
      {isBn ? "EN" : "বাং"}
    </button>
  );
}
