// ── Symptom list loaded from /symptom_master_list.csv at runtime ──

let _cachedSymptoms: string[] | null = null;
let _loadingPromise: Promise<string[]> | null = null;

function toId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function loadSymptoms(): Promise<string[]> {
  if (_cachedSymptoms) return _cachedSymptoms;
  if (_loadingPromise) return _loadingPromise;

  _loadingPromise = fetch("/symptom_master_list.csv")
    .then((res) => res.text())
    .then((text) => {
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      // Skip header row
      const symptoms = lines.slice(1);
      _cachedSymptoms = symptoms;
      return symptoms;
    });

  return _loadingPromise;
}

export function nameToId(name: string): string {
  return toId(name);
}

export function idToName(id: string, symptomList: string[]): string {
  const found = symptomList.find((s) => toId(s) === id);
  if (found) return found;
  return id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Quick symptom chips for the landing page (static, no CSV dependency) ──
export const quickSymptomNames: string[] = [
  "Headache", "Cough", "Fever", "Diarrhea", "Fatigue", "Sore throat",
  "Chest pain", "Back pain", "Rash", "Nausea", "Dizziness", "Anxiety",
];

// ── Chat flow types ──

export interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  quickReplies?: string[];
  batchQuestions?: { symptom: string; question_text: string; score: number }[];
  savedBatchAnswers?: Record<string, "yes" | "no" | "unsure">;
  variantOptions?: string[];
  variantQuestionText?: string;
  savedVariantSelections?: string[];
}
