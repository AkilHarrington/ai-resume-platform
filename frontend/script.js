const form = document.getElementById("resumeForm");
const statusText = document.getElementById("status");
const generateBtn = document.getElementById("generateBtn");
const actions = document.getElementById("actions");
const previewCard = document.getElementById("previewCard");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const downloadDocxBtn = document.getElementById("downloadDocxBtn");

const atsPanel = document.getElementById("atsPanel");
const atsScore = document.getElementById("atsScore");
const matchedKeywords = document.getElementById("matchedKeywords");
const missingKeywords = document.getElementById("missingKeywords");

const isLocal =
  window.location.protocol === "file:" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "";

const API_BASE_URL = isLocal
  ? "http://127.0.0.1:8000"
  : "https://YOUR-BACKEND-URL.onrender.com";

let latestFormData = null;
let latestResumeData = null;

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
    job_description: document.getElementById("job_description").value.trim()
  };
}

function renderList(items) {
  if (!items || items.length === 0) return "";
  return `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
}

function renderResumePreview(resume) {
  const experienceHtml = (resume.professional_experience || [])
    .map(item => {
      const bullets = renderList(item.description || []);
      return `
        <div class="preview-role">
          ${item.company || ""}
          ${item.title ? `<span class="preview-role-title"> — ${item.title}</span>` : ""}
        </div>
        ${bullets}
      `;
    })
    .join("");

  previewCard.innerHTML = `
    <div class="preview-header">
      <h3>${resume.full_name || ""}</h3>
      <div class="preview-contact">
        ${[resume.location, resume.phone, resume.email].filter(Boolean).join(" | ")}
      </div>
    </div>

    ${resume.professional_summary ? `
      <div class="preview-section">
        <h4>Professional Summary</h4>
        <p>${resume.professional_summary}</p>
      </div>
    ` : ""}

    ${(resume.skills || []).length ? `
      <div class="preview-section">
        <h4>Skills</h4>
        ${renderList(resume.skills)}
      </div>
    ` : ""}

    ${experienceHtml ? `
      <div class="preview-section">
        <h4>Professional Experience</h4>
        ${experienceHtml}
      </div>
    ` : ""}

    ${(resume.education || []).length ? `
      <div class="preview-section">
        <h4>Education</h4>
        ${renderList(resume.education)}
      </div>
    ` : ""}

    ${(resume.certifications || []).length ? `
      <div class="preview-section">
        <h4>Certifications</h4>
        ${renderList(resume.certifications)}
      </div>
    ` : ""}
  `;
}

function renderATS(analysis) {
  atsPanel.classList.remove("hidden");
  atsScore.textContent = `${analysis.ats_score}%`;

  matchedKeywords.innerHTML = "";
  missingKeywords.innerHTML = "";

  (analysis.matched_keywords || []).forEach(keyword => {
    const li = document.createElement("li");
    li.textContent = keyword;
    matchedKeywords.appendChild(li);
  });

  (analysis.missing_keywords || []).forEach(keyword => {
    const li = document.createElement("li");
    li.textContent = keyword;
    missingKeywords.appendChild(li);
  });
}

async function downloadFile(endpoint, filename) {
  if (!latestFormData) {
    statusText.textContent = "Generate a preview first.";
    return;
  }

  downloadPdfBtn.disabled = true;
  downloadDocxBtn.disabled = true;
  statusText.textContent = `Preparing ${filename}...`;

  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(latestFormData)
    });

    if (!response.ok) {
      throw new Error(`Failed to generate ${filename}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
    statusText.textContent = `${filename} downloaded successfully.`;
  } catch (error) {
    console.error(error);
    statusText.textContent = `Something went wrong while downloading ${filename}.`;
  } finally {
    downloadPdfBtn.disabled = false;
    downloadDocxBtn.disabled = false;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  latestFormData = getFormData();

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  actions.classList.add("hidden");
  atsPanel.classList.add("hidden");
  statusText.textContent = "Generating resume preview...";

  try {
    const response = await fetch(`${API_BASE_URL}/ats-score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(latestFormData)
    });

    if (!response.ok) {
      throw new Error("Failed to generate resume preview");
    }

    const result = await response.json();

    latestResumeData = result.resume;
    renderResumePreview(result.resume);
    renderATS(result.ats_analysis);

    actions.classList.remove("hidden");
    statusText.textContent = "Resume preview generated successfully.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Something went wrong. Check the backend server.";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Resume Preview";
  }
});

downloadPdfBtn.addEventListener("click", async () => {
  await downloadFile("generate-resume-pdf", "resume.pdf");
});

downloadDocxBtn.addEventListener("click", async () => {
  await downloadFile("generate-resume-docx", "resume.docx");
});