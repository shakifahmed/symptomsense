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

// ── Common symptoms shown at the top of the symptom picker ──
const _commonSet = new Set([
  "Headache", "Cough", "Fever", "Diarrhea", "Fatigue", "Sore throat",
  "Chest pain", "Back pain", "Rash", "Nausea", "Dizziness", "Anxiety",
  "Vomiting", "Abdominal pain", "Shortness of breath", "Runny nose",
  "Sneezing", "Body ache", "Joint pain", "Muscle pain",
  "Loss of appetite", "Constipation", "Bloating", "Heartburn",
  "Insomnia", "Weight loss", "Weight gain", "Sweating",
  "Chills", "Itching", "Swelling", "Numbness",
  "Frequent urination", "Blurred vision", "Ear pain", "Toothache",
  "Neck pain", "Knee pain", "Stomach pain", "Eye pain",
]);
export const commonSymptomNames = _commonSet;

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
