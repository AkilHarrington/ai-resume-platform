// =====================================================
// RESUME KEYWORD MATCHER
// Phrase-aware deterministic matching
// =====================================================

import { ResumeKeywordMatchResult } from "./job-intelligence-types";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function singularizeWord(word: string): string {
  if (word.endsWith("ies") && word.length > 4) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }

  return word;
}

function normalizePhraseForMatching(text: string): string {
  return normalizeText(text)
    .split(" ")
    .map(singularizeWord)
    .join(" ")
    .trim();
}

function phraseExistsInResume(normalizedResume: string, keyword: string): boolean {
  const normalizedKeyword = normalizePhraseForMatching(keyword);

  if (!normalizedKeyword) return false;

  const pattern = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, "i");
  return pattern.test(normalizedResume);
}

export function matchResumeKeywords(
  resumeText: string,
  jobKeywords: string[]
): ResumeKeywordMatchResult {
  if (!resumeText || jobKeywords.length === 0) {
    return {
      matchedKeywords: [],
      missingKeywords: [],
      matchScore: 0
    };
  }

  const normalizedResume = normalizePhraseForMatching(resumeText);

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  for (const keyword of jobKeywords) {
    if (phraseExistsInResume(normalizedResume, keyword)) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  }

  const matchScore =
    jobKeywords.length === 0
      ? 0
      : Math.round((matchedKeywords.length / jobKeywords.length) * 100);

  return {
    matchedKeywords,
    missingKeywords,
    matchScore
  };
}