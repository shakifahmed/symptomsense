import i18n from "./index";
import symptomBn from "./symptom_bn.json";

const bnToEn: Record<string, string> = {};
const enToBn: Record<string, string> = symptomBn as Record<string, string>;

for (const [en, bn] of Object.entries(enToBn)) {
  bnToEn[bn] = en;
}

export function toDisplayName(englishName: string): string {
  if (i18n.language !== "bn") return englishName;
  const bn = enToBn[englishName.toLowerCase()];
  return bn || englishName;
}

export function toEnglishName(displayName: string): string {
  if (i18n.language !== "bn") return displayName;
  const en = bnToEn[displayName];
  if (en) return en;
  const enLower = bnToEn[displayName.toLowerCase()];
  if (enLower) return enLower;
  return displayName;
}

export function getDisplaySymptomList(englishList: string[]): string[] {
  if (i18n.language !== "bn") return englishList;
  return englishList.map((s) => enToBn[s.toLowerCase()] || s);
}

export function getCurrentLanguage(): string {
  return i18n.language;
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBnDigits(s: string): string {
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
}

export function toEnDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function localizeDigits(n: number | string): string {
  const s = String(n);
  return i18n.language === "bn" ? toBnDigits(s) : s;
}
