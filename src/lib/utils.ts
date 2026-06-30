import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function adaptTextForCheckFor(text: string, lang: string, checkFor: string): string {
  if (checkFor === "self") return text;
  if (lang === "bn") {
    if (checkFor === "child") {
      return text.replace("আপনার", "আপনার সন্তানের").replace("আপনি", "আপনার সন্তান");
    }
    return text.replace("আপনার", "রোগীর").replace("আপনি", "রোগী");
  }
  if (checkFor === "child") {
    return text.replace(/\byou're\b/i, "your child is").replace(/\byour\b/, "your child's");
  }
  return text.replace(/\byou're\b/i, "the patient is").replace(/\byour\b/, "the patient's");
}
