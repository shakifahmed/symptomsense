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
  "Chest pain", "Back pain", "Nausea", "Dizziness", "Anxiety",
];

// ── Common symptoms shown at the top of the symptom picker ──
const _commonSet = new Set([
  "Headache", "Cough", "Fever", "Diarrhea", "Fatigue", "Sore throat",
  "Chest pain", "Back pain", "Rash", "Nausea", "Dizziness", "Anxiety",
  "Vomiting", "Abdominal pain", "Shortness of breath", "Runny nose",
  "Sneezing", "Joint pain", "Muscle pain",
  "Loss of appetite", "Constipation", "Bloating", "Heartburn",
  "Insomnia", "Weight loss", "Weight gain", "Sweating",
  "Chills", "Itching", "Swelling", "Numbness",
  "Frequent urination", "Blurred vision", "Ear pain", "Toothache",
  "Neck pain", "Knee pain", "Stomach pain", "Eye pain",
]);
export const commonSymptomNames = _commonSet;

// ── Chief complaint symptoms (broad umbrella symptoms only) ──
export const chiefComplaintNames = new Set([
  "Abdominal Pain", "Acne", "Allergy", "Anemia", "Anxiety",
  "Back Pain", "Bad Breath", "Bleeding", "Blisters", "Bloating",
  "Blurred Vision", "Body Pain", "Bone Pain", "Breast Tenderness",
  "Bruising", "Chest Pain", "Chills", "Cold", "Confusion",
  "Constipation", "Cough", "Cramping", "Dandruff",
  "Dark Urine", "Dehydration", "Depression", "Diarrhea", "Difficulty Breathing",
  "Difficulty Swallowing", "Dizziness", "Double Vision", "Drowsiness", "Dry Cough",
  "Dry Eyes", "Dry Mouth", "Dry Skin", "Ear Pain", "Elbow Pain",
  "Eye Pain", "Fever", "Forgetfulness", "Frequent Urination",
  "Gas", "Hair Loss", "Hallucination", "Headache", "Hearing Loss",
  "Heart Burn", "Heartburn", "High Blood Pressure", "Hip Pain", "Hives",
  "Hoarseness", "Indigestion", "Insomnia", "Irregular Heartbeat", "Irritability",
  "Itching", "Jaundice", "Jaw Pain", "Joint Pain", "Knee Pain",
  "Leg Pain", "Lightheadedness", "Loss Of Appetite", "Loss Of Balance", "Low Blood Pressure",
  "Memory Loss", "Mood Swings", "Mouth Pain", "Mouth Sore", "Mouth Ulcer",
  "Muscle Cramp", "Muscle Pain", "Muscle Stiffness", "Muscle Weakness", "Nasal Congestion",
  "Nausea", "Neck Pain", "Night Sweats", "Nose Bleeds", "Numbness",
  "Painful Urination", "Paralysis", "Rash", "Restlessness", "Ringing In Ears",
  "Runny Nose", "Seizure", "Shortness Of Breath", "Shoulder Pain", "Skin Rash",
  "Sneezing", "Sore Throat", "Stiffness", "Stomach Pain", "Sweating",
  "Swelling", "Tingling", "Tiredness", "Toothache", "Tremor",
  "Vomiting", "Weakness", "Weight Gain", "Weight Loss", "Wheezing",
]);

// ── Chief complaints grouped by body system (for browse page) ──
export const chiefComplaintCategories: { key: string; symptoms: string[] }[] = [
  { key: "cat_general", symptoms: [
    "Fever", "Chills", "Tiredness", "Weakness", "Sweating",
    "Night Sweats", "Dehydration", "Loss Of Appetite", "Weight Loss", "Weight Gain",
    "Cold", "Allergy", "Anemia", "Jaundice",
  ]},
  { key: "cat_digestive", symptoms: [
    "Nausea", "Vomiting", "Diarrhea", "Abdominal Pain", "Stomach Pain",
    "Bloating", "Constipation", "Heartburn", "Heart Burn", "Indigestion", "Gas",
    "Cramping",
  ]},
  { key: "cat_respiratory", symptoms: [
    "Cough", "Dry Cough", "Shortness Of Breath", "Difficulty Breathing",
    "Sore Throat", "Runny Nose", "Sneezing", "Nasal Congestion",
    "Wheezing", "Hoarseness",
  ]},
  { key: "cat_pain", symptoms: [
    "Headache", "Back Pain", "Chest Pain", "Neck Pain", "Shoulder Pain",
    "Knee Pain", "Hip Pain", "Leg Pain", "Elbow Pain", "Jaw Pain",
    "Body Pain", "Bone Pain", "Muscle Pain", "Muscle Cramp",
    "Joint Pain", "Toothache",
  ]},
  { key: "cat_neurological", symptoms: [
    "Dizziness", "Lightheadedness", "Numbness", "Tingling", "Tremor",
    "Seizure", "Blurred Vision", "Double Vision", "Memory Loss",
    "Confusion", "Forgetfulness", "Loss Of Balance", "Paralysis", "Drowsiness",
  ]},
  { key: "cat_skin", symptoms: [
    "Rash", "Skin Rash", "Itching", "Hives", "Dry Skin", "Blisters",
    "Bruising", "Swelling", "Acne", "Dandruff", "Hair Loss",
  ]},
  { key: "cat_heart", symptoms: [
    "Irregular Heartbeat", "High Blood Pressure", "Low Blood Pressure",
  ]},
  { key: "cat_mental", symptoms: [
    "Anxiety", "Depression", "Insomnia", "Irritability", "Mood Swings",
    "Restlessness", "Hallucination",
  ]},
  { key: "cat_ent", symptoms: [
    "Ear Pain", "Hearing Loss", "Ringing In Ears", "Difficulty Swallowing",
    "Nose Bleeds", "Bad Breath", "Mouth Pain", "Mouth Sore", "Mouth Ulcer",
  ]},
  { key: "cat_eye", symptoms: [
    "Eye Pain", "Dry Eyes",
  ]},
  { key: "cat_urinary", symptoms: [
    "Frequent Urination", "Painful Urination", "Dark Urine",
  ]},
  { key: "cat_other", symptoms: [
    "Stiffness", "Muscle Stiffness", "Muscle Weakness", "Breast Tenderness",
    "Bleeding",
  ]},
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
