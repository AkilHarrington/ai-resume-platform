// =====================================================
// JOB DESCRIPTION KEYWORD EXTRACTOR
// Phrase-first deterministic extraction
// =====================================================

import { JobKeywordExtractionResult } from "./job-intelligence-types";

const STOP_WORDS = new Set([
  "the", "and", "a", "an", "to", "for", "of", "in", "on", "with", "by", "at",
  "is", "are", "was", "were", "be", "been", "being",
  "this", "that", "these", "those",
  "will", "would", "should", "can", "could", "may", "might",
  "we", "our", "you", "your", "they", "their",

  // JD filler
  "role", "responsibilities", "requirements", "job", "position",
  "candidate", "team", "company", "ability",
  "seeking", "include", "includes", "including", "preferred",
  "skills", "skill", "experience", "ideal", "strong", "comfortable",
  "responsible", "activities", "tasks", "duties", "work",

  // weak verbs / glue words
  "supporting", "building", "producing", "partnering", "preparing",
  "improving", "coordinating", "monitoring", "validating", "identifying",
  "strengthening", "analyzing", "delivering"
]);

const MIN_KEYWORD_LENGTH = 3;

// Most important phrases first.
// Order matters: longer phrases should appear before shorter overlapping ones.
const PHRASE_KEYWORDS = [
  "cross functional collaboration",
  "cross functional initiatives",
  "cross functional teams",
  "stakeholder communication",
  "business analysis",
  "data analysis",
  "data validation",
  "dashboard development",
  "dashboard consistency",
  "workflow efficiency",
  "workflow optimization",
  "process improvement",
  "operational reporting",
  "performance tracking",
  "kpi tracking",
  "power bi",
  "project coordination",
  "project execution",
  "management reporting",
  "executive reporting",
  "forecasting",
  "excel",
  "sql",
  "data driven decision making",
  "executive reporting",
  "performance metrics",
  "reporting accuracy",
  "business planning"
];

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

function shouldKeepToken(word: string): boolean {
  if (!word) return false;
  if (word.length < MIN_KEYWORD_LENGTH) return false;
  if (STOP_WORDS.has(word)) return false;

  // Drop weak gerunds/past-tense verbs that create ATS noise.
  if (word.endsWith("ing")) return false;
  if (word.endsWith("ed")) return false;

  return true;
}

export function extractJobKeywords(jobDescription: string): JobKeywordExtractionResult {
  if (!jobDescription || jobDescription.trim().length === 0) {
    return { keywords: [] };
  }

  const normalizedText = normalizeText(jobDescription);

  // 1) Detect phrases first
  const foundPhrases = PHRASE_KEYWORDS.filter((phrase) => {
    const pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
    return pattern.test(normalizedText);
  });

  // 2) Remove phrases before tokenization so they do not split into junk tokens
  let textWithoutPhrases = normalizedText;

  for (const phrase of foundPhrases) {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    textWithoutPhrases = textWithoutPhrases.replace(regex, " ");
  }

  // 3) Tokenize remainder
  const phraseWords = new Set(
  foundPhrases.flatMap(p => p.split(" "))
)

const tokens = textWithoutPhrases
  .split(/\s+/)
  .map(word => word.trim())
  .filter(Boolean)
  .filter(word => !phraseWords.has(word))
  .filter(shouldKeepToken)

  // 4) Combine phrases + remaining tokens
  const keywords = Array.from(new Set([
    ...foundPhrases,
    ...tokens
  ]));

  return { keywords };
}