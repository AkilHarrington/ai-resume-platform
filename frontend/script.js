/*
=========================================================
File: script.js
Purpose:
Main frontend controller for the AI Resume Platform.

Responsibilities:
- Manage frontend state
- Handle package gate logic
- Handle template selection
- Send API requests to backend
- Render resume preview
- Render ATS analysis
- Render advanced analysis panels
- Render cover letter preview
- Trigger downloads
- Trigger Stripe checkout flow

Key Notes:
- This is currently the most important frontend logic file
- The code is structured for MVP delivery, not final modular architecture
- Many render functions depend on backend response structure
- Free vs Pro access is currently enforced on the frontend for MVP speed
- Future refactor should split this file into smaller modules after deployment stability
=========================================================
*/

// =========================================================
// DOM ELEMENT REFERENCES
// =========================================================

const form = document.getElementById("resumeForm");
const statusText = document.getElementById("status");
const generateBtn = document.getElementById("generateBtn");
const actions = document.getElementById("actions");
const previewCard = document.getElementById("previewCard");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadDocxBtn = document.getElementById("downloadDocxBtn");
const improveResumeBtn = document.getElementById("improveResumeBtn");
const generateCoverLetterBtn = document.getElementById("generateCoverLetterBtn");
const downloadCoverLetterBtn = document.getElementById("downloadCoverLetterBtn");
const upgradeBtn = document.getElementById("upgradeBtn");

const templateSelect = document.getElementById("template");
const templateNote = document.getElementById("templateNote");
const templateCards = document.querySelectorAll(".template-card");

const freePackageCard = document.getElementById("freePackageCard");
const proPackageCard = document.getElementById("proPackageCard");
const upgradeNotice = document.getElementById("upgradeNotice");

const atsPanel = document.getElementById("atsPanel");
const atsScore = document.getElementById("atsScore");
const matchedKeywords = document.getElementById("matchedKeywords");
const missingKeywords = document.getElementById("missingKeywords");

const scoreComparison = document.getElementById("scoreComparison");
const originalScore = document.getElementById("originalScore");
const improvedScore = document.getElementById("improvedScore");
const scoreDelta = document.getElementById("scoreDelta");

const improvementPanel = document.getElementById("improvementPanel");
const improvementList = document.getElementById("improvementList");
const addedKeywordsWrap = document.getElementById("addedKeywordsWrap");
const addedKeywords = document.getElementById("addedKeywords");

const keywordStatus = document.getElementById("keywordStatus");

const skillGapPanel = document.getElementById("skillGapPanel");
const strongSkills = document.getElementById("strongSkills");
const partialSkills = document.getElementById("partialSkills");
const missingSkills = document.getElementById("missingSkills");

const strengthMeterPanel = document.getElementById("strengthMeterPanel");
const strengthBadge = document.getElementById("strengthBadge");
const strengthKeywordMatch = document.getElementById("strengthKeywordMatch");
const strengthKeywordMatchValue = document.getElementById("strengthKeywordMatchValue");
const strengthClarity = document.getElementById("strengthClarity");
const strengthClarityValue = document.getElementById("strengthClarityValue");
const strengthImpact = document.getElementById("strengthImpact");
const strengthImpactValue = document.getElementById("strengthImpactValue");
const strengthStructure = document.getElementById("strengthStructure");
const strengthStructureValue = document.getElementById("strengthStructureValue");
const strengthTone = document.getElementById("strengthTone");
const strengthToneValue = document.getElementById("strengthToneValue");

const comparisonPanel = document.getElementById("comparisonPanel");
const originalResumeComparison = document.getElementById("originalResumeComparison");
const improvedResumeComparison = document.getElementById("improvedResumeComparison");

const rewriteExplanationPanel = document.getElementById("rewriteExplanationPanel");
const rewriteExplanationList = document.getElementById("rewriteExplanationList");

const loadingState = document.getElementById("loadingState");
const loadingText = document.getElementById("loadingText");

const coverLetterSection = document.getElementById("coverLetterSection");
const coverLetterPreview = document.getElementById("coverLetterPreview");

// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL = "http://localhost:3000/api/resume";

const TEMPLATE_NOTES = {
  professional: "Professional — Classic, compact, ATS-safe",
  modern: "Modern — Clean, contemporary, title under name",
  executive: "Executive — Premium, strongest hierarchy, leadership style"
};

// =========================================================
// BACKEND INTEGRATION HELPERS
// =========================================================

/*
Purpose:
Bridge the legacy MVP frontend structure to the new
TypeScript backend API.

Why this exists:
- Current HTML form is structured by fields
- New backend currently expects rawText
- Current renderers expect older frontend-friendly shapes

So this layer:
1. composes rawText from the form
2. calls the new backend
3. adapts backend responses into shapes the current UI can render
*/

function composeRawResumeText(formData) {
  const sections = [];

  const basics = [
    formData.name,
    formData.email,
    formData.phone,
    formData.location
  ].filter(Boolean);

  if (basics.length) {
    sections.push(basics.join(" | "));
  }

  if (formData.skills) {
    sections.push("SKILLS");
    sections.push(formData.skills);
  }

  if (formData.experience) {
    sections.push("EXPERIENCE");
    sections.push(formData.experience);
  }

  if (formData.education) {
    sections.push("EDUCATION");
    sections.push(formData.education);
  }

  if (formData.certifications) {
    sections.push("CERTIFICATIONS");
    sections.push(formData.certifications);
  }

  return sections.join("\n\n").trim();
}

async function postResumeApi(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

async function scanResumeRequest(rawText) {
  return postResumeApi("/scan", { rawText });
}

async function optimizeResumeRequest(rawText) {
  return postResumeApi("/optimize", { rawText });
}

function adaptContentJsonToPreviewResume(contentJson) {
  return {
    full_name: contentJson?.basics?.fullName || "",
    email: contentJson?.basics?.email || "",
    phone: contentJson?.basics?.phone || "",
    location: contentJson?.basics?.location || "",
    professional_summary: contentJson?.summary || "",

    skills: [
      ...(contentJson?.skills?.core || []),
      ...(contentJson?.skills?.technical || []),
      ...(contentJson?.skills?.tools || []),
      ...(contentJson?.skills?.soft || [])
    ],

    professional_experience: (contentJson?.experience || []).map(item => {
      const rawCompany = item.company || "";
      const rawTitle = item.title || "";

      let company = rawCompany;
      let title = rawTitle;

      if (!company && title.includes("—")) {
        const parts = title.split("—").map(part => part.trim()).filter(Boolean);

        if (parts.length >= 2) {
          title = parts[0];
          company = parts.slice(1).join(" — ");
        }
      }

      if (!company && title.includes("-")) {
        const parts = title.split("-").map(part => part.trim()).filter(Boolean);

        if (parts.length >= 2) {
          title = parts[0];
          company = parts.slice(1).join(" - ");
        }
      }

      return {
        company,
        title,
        description: item.bullets || []
      };
    }),

    education: (contentJson?.education || []).map(item => {
      return [item.institution, item.credential, item.fieldOfStudy]
        .filter(Boolean)
        .join(" — ");
    }),

    certifications: (contentJson?.certifications || []).map(item => {
      return [item.name, item.issuer]
        .filter(Boolean)
        .join(" — ");
    })
  };
}

function adaptScoringToAtsAnalysis(scoring) {
  const scoreSnapshot = scoring?.scoreSnapshot || {};

  return {
    ats_score: scoreSnapshot.overall || 0,
    matched_keywords: [],
    missing_keywords: [],
    issues: scoring?.issues || [],
    recommendations: scoring?.recommendations || [],
    rulesTriggered: scoring?.rulesTriggered || {}
  };
}

function adaptComparisonScoresForUI(originalScoring, optimizedScoring) {
  return {
    original: adaptScoringToAtsAnalysis(originalScoring),
    improved: adaptScoringToAtsAnalysis(optimizedScoring)
  };
}

// =========================================================
// FRONTEND STATE
// =========================================================

let latestFormData = null;
let latestMatchedKeywords = [];
let currentPackage = localStorage.getItem("pro_user") === "true" ? "pro" : "free";

// =========================================================
// PACKAGE GATE LOGIC
// =========================================================

function isPro() {
  return currentPackage === "pro";
}

function premiumBlockedMessage() {
  setStatus(
    "Upgrade to Pro to unlock resume optimization, cover letters, all templates, downloads, and advanced ATS insights.",
    "error"
  );
  upgradeNotice.classList.remove("hidden");
}

function setActivePackage(pkg) {
  currentPackage = pkg;

  if (pkg === "pro") {
    localStorage.setItem("pro_user", "true");
  } else {
    localStorage.removeItem("pro_user");
  }

  freePackageCard.classList.toggle("active", pkg === "free");
  proPackageCard.classList.toggle("active", pkg === "pro");

  updatePremiumLocks();

  // If user is free, force professional template.
  // If user is pro, keep currently selected template.
  if (!isPro()) {
    forceTemplateSelection("professional");
  } else {
    forceTemplateSelection(templateSelect.value || "professional");
  }
}

function updatePremiumLocks() {
  const locked = !isPro();

  improveResumeBtn.classList.toggle("locked-button", locked);
  downloadPdfBtn.classList.toggle("locked-button", locked);
  downloadDocxBtn.classList.toggle("locked-button", locked);
  generateCoverLetterBtn.classList.toggle("locked-button", locked);
  downloadCoverLetterBtn.classList.toggle("locked-button", locked);

  templateCards.forEach(card => {
    const template = card.dataset.template;
    const shouldLock = locked && template !== "professional";
    card.classList.toggle("locked-template", shouldLock);
  });

  if (locked) {
    upgradeNotice.classList.remove("hidden");
  } else {
    upgradeNotice.classList.add("hidden");
  }
}

// =========================================================
// TEMPLATE SELECTION LOGIC
// =========================================================

function forceTemplateSelection(template) {
  templateCards.forEach(card => {
    card.classList.toggle("active", card.dataset.template === template);
  });

  templateSelect.value = template;
  templateNote.textContent =
    TEMPLATE_NOTES[template] || TEMPLATE_NOTES.professional;
}

function setActiveTemplateCard(template) {
  if (!isPro() && template !== "professional") {
    premiumBlockedMessage();
    forceTemplateSelection("professional");
    return;
  }

  forceTemplateSelection(template);
}

// =========================================================
// GENERAL UI HELPERS
// =========================================================

function getFormData() {
  return {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    location: document.getElementById("location").value.trim(),
    skills: document.getElementById("skills").value.trim(),
    experience: document.getElementById("experience").value.trim(),
    education: document.getElementById("education").value.trim(),
    certifications: document.getElementById("certifications").value.trim(),
    job_description: document.getElementById("job_description").value.trim(),
    template: templateSelect.value
  };
}

function showLoading(message) {
  loadingText.textContent = message;
  loadingState.classList.remove("hidden");
}

function hideLoading() {
  loadingState.classList.add("hidden");
  loadingText.textContent = "Working...";
}

function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.className = "";

  if (type === "success") {
    statusText.classList.add("status-success");
  } else if (type === "error") {
    statusText.classList.add("status-error");
  } else {
    statusText.classList.add("status-info");
  }
}

function getErrorMessage(error, fallbackMessage) {
  if (error.name === "TypeError") {
    return "Unable to reach the server. Please check your connection and try again.";
  }
  return fallbackMessage;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeKeywordForHighlight(keyword) {
  return String(keyword || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim();
}

function uniqueHighlightKeywords(keywords) {
  const seen = new Set();
  const result = [];

  for (const keyword of keywords || []) {
    const clean = normalizeKeywordForHighlight(keyword);
    if (!clean || clean.length < 4) continue;
    if (seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
  }

  return result.sort((a, b) => b.length - a.length);
}

function highlightText(text, keywords) {
  let html = escapeHtml(text);
  const cleanedKeywords = uniqueHighlightKeywords(keywords);

  for (const keyword of cleanedKeywords) {
    const pattern = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, "gi");
    html = html.replace(
      pattern,
      '<span class="resume-keyword-highlight">$1</span>'
    );
  }

  return html;
}

// =========================================================
// RESUME PREVIEW RENDERING
// =========================================================

function renderList(items, keywords = []) {
  if (!items || items.length === 0) return "";
  return `<ul>${items.map(item => `<li>${highlightText(item, keywords)}</li>`).join("")}</ul>`;
}

function renderSkills(skills, template, keywords = []) {
  if (!skills || skills.length === 0) return "";

  if (template === "modern") {
    return `<div class="preview-skills-inline">${skills.map(skill => highlightText(skill, keywords)).join(" • ")}</div>`;
  }

  if (template === "executive") {
    return `<div class="preview-skills-pipes">${skills.map(skill => highlightText(skill, keywords)).join(" | ")}</div>`;
  }

  return renderList(skills, keywords);
}

function renderExperience(items, template, keywords = []) {
  if (!items || items.length === 0) return "";

  return items.map(item => {
    const company = highlightText(item.company || "", keywords);
    const title = highlightText(item.title || "", keywords);
    const bullets = renderList(item.description || [], keywords);

    if (template === "modern") {
      return `
        <div class="preview-role">
          <div class="preview-role-title-first">${title}</div>
          <div class="preview-role-company-second">${company}</div>
        </div>
        ${bullets}
      `;
    }

    if (template === "executive") {
      return `
        <div class="preview-role">
          <div class="preview-role-company-stacked">${company}</div>
          <div class="preview-role-title-stacked">${title}</div>
        </div>
        ${bullets}
      `;
    }

    return `
      <div class="preview-role">
        <span class="preview-role-company">${company}</span>
        ${item.title ? `<span class="preview-role-title"> — ${title}</span>` : ""}
      </div>
      ${bullets}
    `;
  }).join("");
}

function estimateSubtitle(resume) {
  const roles = resume.professional_experience || [];
  if (roles.length && roles[0].title) return roles[0].title;
  return "";
}

function applyPreviewTemplateClass(template) {
  previewCard.classList.remove(
    "preview-template-professional",
    "preview-template-modern",
    "preview-template-executive"
  );
  previewCard.classList.add(`preview-template-${template}`);
}

function renderResumePreview(resume, template = "professional", keywords = []) {
  applyPreviewTemplateClass(template);

  const subtitle = estimateSubtitle(resume);
  const showSubtitle = template === "modern" || template === "executive";

  previewCard.innerHTML = `
    <div class="preview-header">
      <h3>${escapeHtml(resume.full_name || "")}</h3>
      ${
        showSubtitle && subtitle
          ? `<div class="preview-subtitle">${highlightText(subtitle, keywords)}</div>`
          : ""
      }
      <div class="preview-contact">
        ${Array.from(
          new Set([resume.location, resume.phone, resume.email].filter(Boolean))
        )
          .map(value => escapeHtml(value))
          .join(" | ")}
      </div>
    </div>

    ${
      resume.professional_summary
        ? `
      <div class="preview-section">
        <h4>Professional Summary</h4>
        <p>${highlightText(resume.professional_summary, keywords)}</p>
      </div>
    `
        : ""
    }

    ${
      (resume.skills || []).length
        ? `
      <div class="preview-section">
        <h4>Skills</h4>
        ${renderSkills(resume.skills, template, keywords)}
      </div>
    `
        : ""
    }

    ${
      (resume.professional_experience || []).length
        ? `
      <div class="preview-section">
        <h4>Professional Experience</h4>
        ${renderExperience(resume.professional_experience, template, keywords)}
      </div>
    `
        : ""
    }

    ${
      (resume.education || []).length
        ? `
      <div class="preview-section">
        <h4>Education</h4>
        ${renderList(resume.education, keywords)}
      </div>
    `
        : ""
    }

    ${
      (resume.certifications || []).length
        ? `
      <div class="preview-section">
        <h4>Certifications</h4>
        ${renderList(resume.certifications, keywords)}
      </div>
    `
        : ""
    }
  `;
}

// =========================================================
// ATS RENDERING
// =========================================================

function renderKeywordPills(items, type) {
  return (items || [])
    .map(keyword => `<li><span class="keyword-pill ${type}">${escapeHtml(keyword)}</span></li>`)
    .join("");
}

function renderATS(analysis) {
  atsPanel.classList.remove("hidden");
  atsScore.textContent = `${analysis.ats_score}%`;

  latestMatchedKeywords = analysis.matched_keywords || [];

  matchedKeywords.innerHTML = renderKeywordPills(analysis.matched_keywords, "matched");
  missingKeywords.innerHTML = renderKeywordPills(analysis.missing_keywords, "missing");

keywordStatus.classList.remove("hidden", "keyword-status-success", "keyword-status-info");

const hasKeywordArrays =
  Array.isArray(analysis.matched_keywords) &&
  Array.isArray(analysis.missing_keywords) &&
  (analysis.matched_keywords.length > 0 || analysis.missing_keywords.length > 0);

if (!hasKeywordArrays) {
  keywordStatus.textContent =
    "Detailed job-description keyword matching is not yet enabled in this build.";
  keywordStatus.classList.add("keyword-status-info");
  matchedKeywords.innerHTML = "";
  missingKeywords.innerHTML = "";
} else if (analysis.missing_keywords.length === 0) {
  keywordStatus.textContent = "All detected job-description keywords are covered ✓";
  keywordStatus.classList.add("keyword-status-success");
} else {
  keywordStatus.textContent = `Still missing ${analysis.missing_keywords.length} job-description keyword(s).`;
  keywordStatus.classList.add("keyword-status-info");
}
}

function renderScoreComparison(beforeScore, afterScore) {
  scoreComparison.classList.remove("hidden");
  originalScore.textContent = `${beforeScore}%`;
  improvedScore.textContent = `${afterScore}%`;

  const delta = afterScore - beforeScore;
  if (delta > 0) {
    scoreDelta.textContent = `▲ +${delta} ATS improvement`;
    scoreDelta.style.color = "#059669";
  } else if (delta === 0) {
    scoreDelta.textContent = "No ATS score change";
    scoreDelta.style.color = "#6b7280";
  } else {
    scoreDelta.textContent = `▼ ${delta} ATS change`;
    scoreDelta.style.color = "#dc2626";
  }
}

function renderImprovementSummary(originalAnalysis, improvedAnalysis) {
  const originalMatched = new Set(originalAnalysis.matched_keywords || []);
  const improvedMatched = new Set(improvedAnalysis.matched_keywords || []);

  const added = [...improvedMatched].filter(keyword => !originalMatched.has(keyword));
  const pointsGained = improvedAnalysis.ats_score - originalAnalysis.ats_score;
  const improvements = [];

  if (pointsGained > 0) {
    improvements.push(`ATS score improved by ${pointsGained} point${pointsGained === 1 ? "" : "s"}.`);
  }

  if (added.length > 0) {
    improvements.push(`The optimized version added ${added.length} new job-relevant keyword${added.length === 1 ? "" : "s"}.`);
  }

  improvements.push("Professional summary and experience language were tightened to align more closely with the target role.");
  improvements.push("Resume bullets were refined to improve clarity, impact, and ATS keyword alignment.");

  improvementList.innerHTML = improvements.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  improvementPanel.classList.remove("hidden");

  if (added.length > 0) {
    addedKeywordsWrap.classList.remove("hidden");
    addedKeywords.innerHTML = added
      .map(keyword => `<span class="added-keyword-pill">${escapeHtml(keyword)}</span>`)
      .join("");
  } else {
    addedKeywordsWrap.classList.add("hidden");
    addedKeywords.innerHTML = "";
  }
}

// =========================================================
// ADVANCED INSIGHT PANELS
// =========================================================

function renderSkillGapAnalysis(matched, missing) {
  skillGapPanel.classList.remove("hidden");

  strongSkills.innerHTML = "";
  partialSkills.innerHTML = "";
  missingSkills.innerHTML = "";

  const safeMatched = matched || [];
  const safeMissing = missing || [];

  const strong = safeMatched.slice(0, Math.min(6, safeMatched.length));
  const partial = safeMatched.slice(6, 10);
  const gaps = safeMissing.slice(0, 8);

  const hasRealSkillData =
  Array.isArray(matched) &&
  Array.isArray(missing) &&
  (matched.length > 0 || missing.length > 0);

if (!hasRealSkillData) {
  strongSkills.innerHTML = `<span class="skill-pill skill-strong">Detailed skill matching will be enabled with JD-aware scoring</span>`;
  partialSkills.innerHTML = `<span class="skill-pill skill-partial">Current build focuses on general resume scoring</span>`;
  missingSkills.innerHTML = `<span class="skill-pill skill-missing">Skill gap detection is deferred for a later phase</span>`;
  return;
}

  strong.forEach(skill => {
    strongSkills.innerHTML += `<span class="skill-pill skill-strong">${escapeHtml(skill)}</span>`;
  });

  partial.forEach(skill => {
    partialSkills.innerHTML += `<span class="skill-pill skill-partial">${escapeHtml(skill)}</span>`;
  });

  gaps.forEach(skill => {
    missingSkills.innerHTML += `<span class="skill-pill skill-missing">${escapeHtml(skill)}</span>`;
  });

  if (strong.length === 0) strongSkills.innerHTML = `<span class="skill-pill skill-strong">No strong matches yet</span>`;
  if (partial.length === 0) partialSkills.innerHTML = `<span class="skill-pill skill-partial">No partial matches yet</span>`;
  if (gaps.length === 0) missingSkills.innerHTML = `<span class="skill-pill skill-strong">No major skill gaps</span>`;
}

function setStrengthBar(element, valueElement, score) {
  const safeScore = Math.max(0, Math.min(10, score));
  element.style.width = `${safeScore * 10}%`;
  valueElement.textContent = `${safeScore}/10`;
}

function getStrengthLabel(total) {
  if (total >= 8.5) return "Excellent";
  if (total >= 7) return "Strong";
  if (total >= 5) return "Fair";
  return "Needs Work";
}

function renderResumeStrengthMeter(analysis, resume) {
  const ats = analysis.ats_score || 0;
  const matchedCount = (analysis.matched_keywords || []).length;

  const keywordMatchScore = Math.min(10, Math.round(ats / 10));
  const summaryLength = (resume.professional_summary || "").length;
  const clarityScore = summaryLength > 180 ? 8 : 6;
  const impactScore = matchedCount >= 15 ? 8 : matchedCount >= 10 ? 7 : 6;

  const sectionCount =
    (resume.professional_summary ? 1 : 0) +
    ((resume.skills || []).length ? 1 : 0) +
    ((resume.professional_experience || []).length ? 1 : 0) +
    ((resume.education || []).length ? 1 : 0) +
    ((resume.certifications || []).length ? 1 : 0);

  const structureScore = sectionCount >= 5 ? 9 : 7;
  const toneScore = ats >= 90 ? 8 : ats >= 75 ? 7 : 6;
  const total = (keywordMatchScore + clarityScore + impactScore + structureScore + toneScore) / 5;

  strengthMeterPanel.classList.remove("hidden");

  setStrengthBar(strengthKeywordMatch, strengthKeywordMatchValue, keywordMatchScore);
  setStrengthBar(strengthClarity, strengthClarityValue, clarityScore);
  setStrengthBar(strengthImpact, strengthImpactValue, impactScore);
  setStrengthBar(strengthStructure, strengthStructureValue, structureScore);
  setStrengthBar(strengthTone, strengthToneValue, toneScore);

  const label = getStrengthLabel(total);
  strengthBadge.textContent = label;

  if (label === "Excellent") {
    strengthBadge.style.background = "#dcfce7";
    strengthBadge.style.color = "#166534";
  } else if (label === "Strong") {
    strengthBadge.style.background = "#dbeafe";
    strengthBadge.style.color = "#1d4ed8";
  } else if (label === "Fair") {
    strengthBadge.style.background = "#fef3c7";
    strengthBadge.style.color = "#92400e";
  } else {
    strengthBadge.style.background = "#fee2e2";
    strengthBadge.style.color = "#991b1b";
  }
}

function renderResumeComparisonCard(resume) {
  const summary = resume.professional_summary || "";
  const skills = resume.skills || [];
  const experience = resume.professional_experience || [];
  const firstRole = experience[0] || {};
  const firstBullets = (firstRole.description || []).slice(0, 3);

  return `
    <div class="comparison-block">
      <h5>Summary</h5>
      <p>${escapeHtml(summary || "No summary available")}</p>

      <h5>Top Skills</h5>
      <p>${skills.slice(0, 8).map(escapeHtml).join(" | ") || "No skills available"}</p>

      <h5>Top Experience Bullets</h5>
      <ul>
        ${
          firstBullets.length
            ? firstBullets.map(bullet => `<li>${escapeHtml(bullet)}</li>`).join("")
            : "<li>No experience bullets available</li>"
        }
      </ul>
    </div>
  `;
}

function renderResumeComparison(originalResume, improvedResume) {
  originalResumeComparison.innerHTML = renderResumeComparisonCard(originalResume);
  improvedResumeComparison.innerHTML = renderResumeComparisonCard(improvedResume);
  comparisonPanel.classList.remove("hidden");
}

function renderRewriteExplanations(originalResume, improvedResume, originalAnalysis, improvedAnalysis) {
  const explanations = [];

  const originalSummary = originalResume.professional_summary || "";
  const improvedSummary = improvedResume.professional_summary || "";

  const originalSkills = JSON.stringify(originalResume.skills || []);
  const improvedSkills = JSON.stringify(improvedResume.skills || []);

  const originalBullets = (originalResume.professional_experience || [])
    .flatMap(role => role.description || []);
  const improvedBullets = (improvedResume.professional_experience || [])
    .flatMap(role => role.description || []);

  const bulletsChanged =
    JSON.stringify(originalBullets) !== JSON.stringify(improvedBullets);

  const scoreBefore = originalAnalysis.ats_score || 0;
  const scoreAfter = improvedAnalysis.ats_score || 0;

  if (improvedSummary !== originalSummary) {
    explanations.push(
      "The professional summary was rewritten to improve positioning and better reflect the candidate’s strengths."
    );
  }

  if (improvedSkills !== originalSkills) {
    explanations.push(
      "The skills section was cleaned and normalized to improve readability and consistency."
    );
  }

  if (bulletsChanged) {
    explanations.push(
      "Experience bullets were refined to improve clarity, stronger phrasing, and overall presentation."
    );
  }

  if (scoreAfter > scoreBefore) {
    explanations.push(
      `The optimized version improved the overall resume score by ${scoreAfter - scoreBefore} point${scoreAfter - scoreBefore === 1 ? "" : "s"}.`
    );
  }

  if (explanations.length === 0) {
    explanations.push(
      "The optimized version preserved most original content because the system did not detect enough grounded evidence to justify stronger rewrites."
    );
  }

  rewriteExplanationList.innerHTML = explanations
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");

  rewriteExplanationPanel.classList.remove("hidden");
}

// =========================================================
// RESET HELPERS
// =========================================================

function resetImprovementSummary() {
  improvementPanel.classList.add("hidden");
  improvementList.innerHTML = "";
  addedKeywordsWrap.classList.add("hidden");
  addedKeywords.innerHTML = "";
}

function resetSkillGapAnalysis() {
  skillGapPanel.classList.add("hidden");
  strongSkills.innerHTML = "";
  partialSkills.innerHTML = "";
  missingSkills.innerHTML = "";
}

function resetStrengthMeter() {
  strengthMeterPanel.classList.add("hidden");
  strengthBadge.textContent = "Strong";
  strengthBadge.style.background = "#dbeafe";
  strengthBadge.style.color = "#1d4ed8";
  setStrengthBar(strengthKeywordMatch, strengthKeywordMatchValue, 0);
  setStrengthBar(strengthClarity, strengthClarityValue, 0);
  setStrengthBar(strengthImpact, strengthImpactValue, 0);
  setStrengthBar(strengthStructure, strengthStructureValue, 0);
  setStrengthBar(strengthTone, strengthToneValue, 0);
}

function resetResumeComparison() {
  comparisonPanel.classList.add("hidden");
  originalResumeComparison.innerHTML = "";
  improvedResumeComparison.innerHTML = "";
}

function resetRewriteExplanations() {
  rewriteExplanationPanel.classList.add("hidden");
  rewriteExplanationList.innerHTML = "";
}

function resetScoreComparison() {
  scoreComparison.classList.add("hidden");
  originalScore.textContent = "0%";
  improvedScore.textContent = "0%";
  scoreDelta.textContent = "";
  resetImprovementSummary();
}

function resetKeywordStatus() {
  keywordStatus.classList.add("hidden");
  keywordStatus.textContent = "";
  keywordStatus.classList.remove("keyword-status-success", "keyword-status-info");
  latestMatchedKeywords = [];
}

function resetCoverLetter() {
  coverLetterSection.classList.add("hidden");
  coverLetterPreview.innerHTML = "";
}

// =========================================================
// COVER LETTER RENDERING
// =========================================================

function renderCoverLetter(text) {
  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length < 4) {
    coverLetterPreview.textContent = text;
    coverLetterSection.classList.remove("hidden");
    return;
  }

  const name = lines[0] || "";
  const contact = lines[1] || "";

  let greetingIndex = lines.findIndex(line => line.toLowerCase().startsWith("dear "));
  let closingIndex = lines.findIndex(line =>
    line.toLowerCase() === "sincerely," ||
    line.toLowerCase() === "kind regards," ||
    line.toLowerCase() === "best regards,"
  );

  if (greetingIndex === -1) greetingIndex = 2;
  if (closingIndex === -1) closingIndex = lines.length - 2;

  const greeting = lines[greetingIndex] || "Dear Hiring Manager,";
  const bodyParagraphs = lines.slice(greetingIndex + 1, closingIndex);
  const closing = lines[closingIndex] || "Sincerely,";
  const signature = lines[closingIndex + 1] || name;

  coverLetterPreview.innerHTML = `
    <div class="cover-letter-header">
      <div class="cover-letter-name">${escapeHtml(name)}</div>
      <div class="cover-letter-contact">${escapeHtml(contact)}</div>
    </div>

    <div class="cover-letter-greeting">${escapeHtml(greeting)}</div>
    ${bodyParagraphs.map(p => `<p class="cover-letter-paragraph">${escapeHtml(p)}</p>`).join("")}

    <div class="cover-letter-closing">
      <p>${escapeHtml(closing)}</p>
      <p>${escapeHtml(signature)}</p>
    </div>
  `;

  coverLetterSection.classList.remove("hidden");
}

// =========================================================
// DOWNLOAD LOGIC
// =========================================================

async function downloadFile(endpoint, filename) {
  setStatus(
    `${filename} download is not yet connected to the new backend build.`,
    "error"
  );
}

// =========================================================
// EVENT LISTENER REGISTRATION
// =========================================================

freePackageCard.addEventListener("click", event => {
  event.preventDefault();
  setActivePackage("free");
});

proPackageCard.addEventListener("click", event => {
  event.preventDefault();
  setActivePackage("pro");
});

templateCards.forEach(card => {
  card.addEventListener("click", event => {
    event.preventDefault();
    const template = card.dataset.template;
    setActiveTemplateCard(template);
  });
});

// Initialize UI from saved package state
setActivePackage(currentPackage);

// =========================================================
// API EVENT HANDLERS
// =========================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  latestFormData = getFormData();
  const rawText = composeRawResumeText(latestFormData);

  generateBtn.disabled = true;
  generateBtn.textContent = "Scanning...";
  actions.classList.add("hidden");
  atsPanel.classList.add("hidden");
  resetScoreComparison();
  resetKeywordStatus();
  resetSkillGapAnalysis();
  resetStrengthMeter();
  resetResumeComparison();
  resetRewriteExplanations();
  resetCoverLetter();
  showLoading("Parsing and scoring resume...");
  setStatus("", "info");

  try {
    const result = await scanResumeRequest(rawText);

    const parser = result.data.parser;
    const scoring = result.data.scoring;

    const adaptedResume = adaptContentJsonToPreviewResume(
      parser.contentJson
    );
    const adaptedAnalysis = adaptScoringToAtsAnalysis(scoring);

    renderATS(adaptedAnalysis);
    renderResumePreview(
      adaptedResume,
      latestFormData.template,
      latestMatchedKeywords
    );

    if (isPro()) {
      renderSkillGapAnalysis([], []);
      renderResumeStrengthMeter(adaptedAnalysis, adaptedResume);
    }

    actions.classList.remove("hidden");
    setStatus("Resume scan completed successfully.", "success");
  } catch (error) {
    console.error(error);
    setStatus(
      getErrorMessage(error, "Unable to scan the resume right now. Please try again."),
      "error"
    );
  } finally {
    hideLoading();
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Resume Preview";
  }
});

improveResumeBtn.addEventListener("click", async () => {
  if (!latestFormData) {
    setStatus("Generate a resume preview before improving it.", "error");
    return;
  }

  if (!isPro()) {
    premiumBlockedMessage();
    return;
  }

  const rawText = composeRawResumeText(latestFormData);

  improveResumeBtn.disabled = true;
  generateBtn.disabled = true;
  downloadPdfBtn.disabled = true;
  downloadDocxBtn.disabled = true;
  generateCoverLetterBtn.disabled = true;
  downloadCoverLetterBtn.disabled = true;
  showLoading("Optimizing resume and comparing improvements...");
  setStatus("", "info");

  try {
    const result = await optimizeResumeRequest(rawText);

    const parser = result.data.parser;
    const originalScoring = result.data.originalScoring;
    const optimizer = result.data.optimizer;
    const optimizedScoring = result.data.optimizedScoring;
    const comparison = result.data.comparison;

    const originalResume = adaptContentJsonToPreviewResume(
      parser.contentJson
    );
    const improvedResume = adaptContentJsonToPreviewResume(
      optimizer.optimizedContentJson
    );

    const adaptedOriginalAnalysis = adaptScoringToAtsAnalysis(originalScoring);
    const adaptedImprovedAnalysis = adaptScoringToAtsAnalysis(optimizedScoring);

    renderATS(adaptedImprovedAnalysis);
    renderSkillGapAnalysis([], []);
    renderResumeStrengthMeter(adaptedImprovedAnalysis, improvedResume);
    renderResumePreview(
      improvedResume,
      latestFormData.template,
      latestMatchedKeywords
    );

    renderScoreComparison(
      comparison.score.before,
      comparison.score.after
    );

    renderImprovementSummary(
      adaptedOriginalAnalysis,
      adaptedImprovedAnalysis
    );

    renderResumeComparison(
      originalResume,
      improvedResume
    );

    renderRewriteExplanations(
      originalResume,
      improvedResume,
      adaptedOriginalAnalysis,
      adaptedImprovedAnalysis
    );

    setStatus("Resume improved successfully.", "success");
  } catch (error) {
    console.error(error);
    setStatus(
      getErrorMessage(error, "Unable to improve the resume right now. Please try again."),
      "error"
    );
  } finally {
    hideLoading();
    improveResumeBtn.disabled = false;
    generateBtn.disabled = false;
    downloadPdfBtn.disabled = false;
    downloadDocxBtn.disabled = false;
    generateCoverLetterBtn.disabled = false;
    downloadCoverLetterBtn.disabled = false;
  }
});

generateCoverLetterBtn.addEventListener("click", async () => {
  if (!isPro()) {
    premiumBlockedMessage();
    return;
  }

  setStatus(
    "Cover letter generation is not yet connected to the new backend build.",
    "error"
  );
});

downloadPdfBtn.addEventListener("click", async () => {
  await downloadFile("generate-resume-pdf", "resume.pdf");
});

downloadDocxBtn.addEventListener("click", async () => {
  await downloadFile("generate-resume-docx", "resume.docx");
});

downloadCoverLetterBtn.addEventListener("click", async () => {
  await downloadFile("generate-cover-letter-docx", "cover_letter.docx");
});

// =========================================================
// STRIPE CHECKOUT LOGIC
// =========================================================

upgradeBtn.addEventListener("click", async () => {
  setStatus(
    "Checkout is not yet connected to the new backend build.",
    "error"
  );
});