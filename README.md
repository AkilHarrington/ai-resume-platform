# AI Resume Platform

AI RESUME PLATFORM — PROJECT OVERVIEW
=====================================

Project Name
------------
AI Resume Platform (MVP)

Project Purpose
---------------
This project is an AI-powered resume optimization platform designed to help users improve their resumes for applicant tracking systems (ATS) and generate supporting job application materials.

The system analyzes a user's resume against a target job description and provides insights into how well the resume aligns with the job requirements. It then uses AI to improve the resume while preserving factual accuracy.

The platform also provides advanced analysis tools to help users understand the quality of their resume.

Core Features
-------------
The MVP currently supports the following features:

Resume Generation
- Resume preview generated from structured user inputs
- Clean formatted resume preview in the browser

ATS Analysis
- ATS match score
- Keyword match detection
- Missing keyword identification

Resume Optimization
- AI-based resume rewriting
- ATS score improvement
- Keyword alignment improvements

Advanced Resume Analysis
- Skill Gap Analysis
- Resume Strength Meter
- AI Rewrite Explanation
- Before vs After Resume Comparison

Templates
- Professional template
- Modern template
- Executive template

Cover Letter Generation
- AI-generated cover letter aligned with the resume and job description

Downloads
- Resume export to PDF
- Resume export to DOCX
- Cover letter export to DOCX

Payment Integration
- Stripe Checkout integration
- Free vs Pro feature gating

Current Project Stage
---------------------
The project is currently a working MVP designed for local development and early deployment.

The goal of this stage is to:
- validate product functionality
- test user behavior
- measure conversion metrics
- prepare for production deployment

Tech Stack
----------
Frontend
- HTML
- CSS
- Vanilla JavaScript

Backend
- Python
- FastAPI
- OpenAI API
- Stripe API

Development Servers
- Backend: Uvicorn
- Frontend: Python http.server

Target Architecture
-------------------
Frontend (Static)
        |
        v
Backend API (FastAPI)
        |
        v
OpenAI API + Stripe API





FRONTEND ARCHITECTURE
=====================

Frontend Folder Structure
-------------------------
frontend/
├── index.html
├── styles.css
├── script.js
└── success.html

Frontend Purpose
----------------
The frontend is a static HTML/CSS/JavaScript application responsible for:
- collecting user resume input
- rendering the resume preview
- calling backend API endpoints
- displaying ATS analysis and advanced resume insights
- handling Free vs Pro package gating
- triggering Stripe checkout
- rendering cover letters
- triggering file downloads

The frontend does not generate resume content itself.
All AI generation, ATS logic, optimization, and file generation happen in the backend.

MAIN FILE RESPONSIBILITIES
--------------------------

1. index.html
-------------
Purpose:
- Defines the complete page layout and all UI containers.

Key UI Areas:
- Package gate (Free vs Pro)
- Resume input form
- Resume template selector
- Generate Resume Preview button
- Premium action buttons
- Resume preview panel
- ATS analysis panel
- Skill Gap Analysis panel
- Resume Strength Meter panel
- Before vs After comparison panel
- AI Rewrite Explanations panel
- Cover Letter panel

Important Notes:
- The HTML contains placeholders only.
- Most dynamic content is injected by script.js.
- IDs in index.html are heavily relied upon by script.js.
- If IDs are changed, the JavaScript will break unless updated.

2. styles.css
-------------
Purpose:
- Provides all styling for layout, forms, templates, analytics panels, comparison views, and premium gate components.

Main Styling Areas:
- overall page layout
- left panel / right panel structure
- form styling
- template card styling
- resume preview styling
- ATS and analysis panel styling
- package gate styling
- premium lock styling
- cover letter styling
- comparison viewer styling
- responsive/mobile behavior

Important Notes:
- Resume preview appearance changes by template through CSS classes.
- Frontend template differences are mostly driven by class changes applied in script.js.

3. script.js
------------
Purpose:
- This is the main frontend controller file.

It handles:
- DOM element selection
- frontend state
- current package state (Free / Pro)
- template selection
- API communication
- resume preview rendering
- ATS rendering
- advanced insight rendering
- file download actions
- Stripe checkout button logic
- premium lock enforcement

MAJOR FRONTEND LOGIC AREAS
--------------------------

A. Global DOM References
------------------------
At the top of script.js, the file grabs all required DOM nodes using document.getElementById and querySelectorAll.

Examples:
- form fields
- ATS panels
- action buttons
- package cards
- template cards
- comparison sections
- cover letter container

Reason:
Centralizing DOM references makes the rest of the file easier to work with.

B. Frontend State
-----------------
Important frontend state variables include:
- latestFormData
- latestMatchedKeywords
- currentPackage

Purpose:
- latestFormData stores the most recent form submission so download and optimization requests can reuse the same payload.
- currentPackage controls access to premium features.
- latestMatchedKeywords are reused for keyword highlighting in the resume preview.

C. Package Gate Logic
---------------------
Main purpose:
- Enforce Free vs Pro behavior on the frontend.

Free Mode:
- Resume preview allowed
- ATS score allowed
- Professional template only
- Premium actions blocked

Pro Mode:
- all templates
- resume optimization
- cover letter
- downloads
- advanced insight panels

Important functions:
- isPro()
- setActivePackage()
- updatePremiumLocks()
- premiumBlockedMessage()

Current MVP implementation:
- Pro unlock is stored in localStorage
- This is acceptable for MVP but should be hardened later with backend validation

D. Template Selection Logic
---------------------------
Templates currently supported:
- professional
- modern
- executive

Main behavior:
- The selected template changes how the resume preview is styled and rendered.
- In Free mode, only the Professional template is allowed.
- In Pro mode, all three templates are available.

Important functions:
- setActiveTemplateCard()
- applyPreviewTemplateClass()

E. API Communication
--------------------
script.js talks to the backend through fetch() calls.

Main endpoints used:
- /ats-score
- /optimize-resume
- /generate-cover-letter
- /generate-resume-pdf
- /generate-resume-docx
- /generate-cover-letter-docx
- /create-checkout-session

Behavior:
- Generate Resume Preview sends form data to /ats-score
- Improve Resume sends same data to /optimize-resume
- Generate Cover Letter sends data to /generate-cover-letter
- Download buttons send data to file-generation endpoints
- Upgrade button sends request to /create-checkout-session

F. Resume Preview Rendering
---------------------------
The resume preview is rendered dynamically after the backend responds.

Main renderer:
- renderResumePreview()

Supporting render helpers:
- renderSkills()
- renderExperience()
- renderList()

Important Notes:
- Resume content structure is expected from backend responses.
- The preview is not raw HTML from the backend.
- The frontend assembles the preview from structured JSON fields.

G. ATS Analysis Rendering
-------------------------
ATS information is displayed in multiple layers.

Main ATS functions:
- renderATS()
- renderScoreComparison()
- renderImprovementSummary()

Displayed information includes:
- ATS score
- matched keywords
- missing keywords
- original vs optimized score
- ATS improvement summary
- added keyword pills

H. Advanced Insight Panels
--------------------------
These are premium analysis features rendered after resume generation and optimization.

Main features:
- Skill Gap Analysis
- Resume Strength Meter
- Before vs After Resume Comparison
- AI Rewrite Explanations

Main functions:
- renderSkillGapAnalysis()
- renderResumeStrengthMeter()
- renderResumeComparison()
- renderRewriteExplanations()

These panels are key product differentiators and should be protected carefully during refactors.

I. Cover Letter Rendering
-------------------------
Main function:
- renderCoverLetter()

Purpose:
- Format the cover letter response from the backend into a clean preview block on the frontend.

J. Downloads
------------
Main function:
- downloadFile()

Purpose:
- Sends the latest form data to backend export endpoints
- receives blob responses
- triggers browser download

K. Stripe Checkout
------------------
Main logic:
- Upgrade button triggers /create-checkout-session
- frontend receives hosted Stripe checkout URL
- browser is redirected to Stripe

After successful payment:
- Stripe redirects to success.html
- success.html sets localStorage.pro_user = true
- page redirects back to index.html
- Pro mode becomes active

IMPORTANT FRONTEND DEPENDENCIES
-------------------------------
The frontend depends on:
- backend being reachable
- correct API_BASE_URL
- stable DOM IDs in index.html
- stable JSON response shapes from backend endpoints
- success.html being accessible through a local or production web server

LOCAL FRONTEND RUNNING INSTRUCTIONS
-----------------------------------
Do not open index.html directly through file:// when testing Stripe.

Correct local run method:
1. open terminal
2. cd ~/ai-resume-platform/frontend
3. run: python -m http.server 5500
4. open: http://localhost:5500

IMPORTANT FRONTEND CAUTIONS
---------------------------
- script.js is the most critical frontend file
- Many features share the same frontend state variables
- Changing IDs in index.html without updating script.js will break functionality
- Changing backend response structure may break multiple renderers
- Free vs Pro logic is currently frontend-heavy and should be considered MVP logic, not final production architecture




BACKEND ARCHITECTURE
====================

Backend Folder Purpose
----------------------
The backend is the core application engine for the AI Resume Platform.

It is responsible for:
- receiving resume input from the frontend
- generating structured resume content
- analyzing ATS alignment
- optimizing resume content against a job description
- generating cover letters
- generating downloadable files
- creating Stripe checkout sessions

The backend does not render UI.
It returns structured data that the frontend uses to display resume previews, ATS insights, and premium analysis panels.

CURRENT BACKEND ROLE IN THE PRODUCT
-----------------------------------
The backend is the source of truth for:
- resume content generation
- resume optimization
- ATS scoring
- keyword matching
- cover letter generation
- export generation
- Stripe payment session creation

If the backend is unavailable, the frontend cannot generate or optimize resumes.

MAIN BACKEND FILES
------------------

1. main.py
----------
Purpose:
- FastAPI application entry point
- defines API routes
- initializes external services
- connects frontend actions to backend logic

Main responsibilities:
- expose the core API endpoints
- receive incoming JSON payloads from the frontend
- call service functions for resume generation and optimization
- create Stripe checkout sessions
- return JSON or file responses

Important Notes:
- main.py is the orchestration layer, not the main AI logic layer
- heavy business logic should stay in service/helper files where possible
- Stripe and environment variable setup should be initialized here

2. services/resume_service.py
-----------------------------
Purpose:
- handles AI-powered resume generation and optimization

Main responsibilities:
- build prompts for the OpenAI model
- generate structured resume output
- optimize an existing resume toward a target job description
- maintain factual consistency while improving wording and ATS alignment

Important Notes:
- this file is the most important backend business-logic file
- most product quality depends on prompt design and output structuring here
- future Phase 2 features such as tone preservation and controlled variation will likely be implemented here or in adjacent service files

3. Export / ATS helper files (if present)
-----------------------------------------
Depending on the current codebase, additional files may handle:
- ATS scoring helper logic
- keyword extraction
- PDF generation
- DOCX generation
- cover letter export formatting

These files should ideally remain focused on one responsibility each.

BACKEND FLOW BY FEATURE
-----------------------

A. Resume Preview Flow
----------------------
Frontend action:
- User clicks Generate Resume Preview

Backend route:
- /ats-score

Backend flow:
1. Receive user form data
2. Generate structured resume content
3. Analyze ATS match score against job description
4. Return:
   - resume content
   - ATS score
   - matched keywords
   - missing keywords

Frontend result:
- Resume preview renders
- ATS panel renders

B. Resume Optimization Flow
---------------------------
Frontend action:
- User clicks Improve Resume

Backend route:
- /optimize-resume

Backend flow:
1. Receive original user form data
2. Generate original resume analysis
3. Optimize resume content using AI
4. Re-run ATS analysis on improved version
5. Return:
   - original resume
   - improved resume
   - original ATS analysis
   - improved ATS analysis

Frontend result:
- improved resume preview renders
- score delta renders
- skill gap panel renders
- strength meter renders
- comparison panel renders
- rewrite explanation panel renders

C. Cover Letter Flow
--------------------
Frontend action:
- User clicks Generate Cover Letter

Backend route:
- /generate-cover-letter

Backend flow:
1. Receive resume data and job description
2. Use AI to generate a targeted cover letter
3. Return text response

Frontend result:
- formatted cover letter preview renders

D. Download Flow
----------------
Frontend actions:
- Download PDF
- Download DOCX
- Download Cover Letter DOCX

Backend routes:
- /generate-resume-pdf
- /generate-resume-docx
- /generate-cover-letter-docx

Backend flow:
1. Receive latest resume data
2. Generate export file
3. Return file response

Frontend result:
- browser download starts

E. Payment Flow
---------------
Frontend action:
- User clicks Upgrade to Pro

Backend route:
- /create-checkout-session

Backend flow:
1. Create Stripe Checkout session
2. Return Stripe-hosted checkout URL

Frontend result:
- browser redirects to Stripe Checkout

After successful payment:
- Stripe redirects user to success.html
- success.html sets localStorage Pro access
- frontend reloads in Pro mode

IMPORTANT BACKEND CONCEPTS
--------------------------

1. Structured Resume Output
---------------------------
The backend should return resume content in a structured format, not raw HTML.

Typical fields expected by the frontend:
- full_name
- location
- phone
- email
- professional_summary
- skills
- professional_experience
- education
- certifications

Reason:
This allows the frontend to render multiple templates using the same backend response shape.

2. ATS Analysis Shape
---------------------
The frontend expects ATS analysis in a stable structure.

Typical fields:
- ats_score
- matched_keywords
- missing_keywords

If this structure changes, multiple frontend panels will break.

3. Separation of Responsibilities
---------------------------------
Current ideal separation:
- main.py = route orchestration
- resume_service.py = AI logic
- export files = file generation logic
- ATS helper files = ATS-specific logic

This separation should be preserved or improved over time.

API ENDPOINT RESPONSIBILITIES
-----------------------------

/ats-score
- Generates resume preview content
- Calculates ATS score
- Returns resume + ATS analysis

/optimize-resume
- Improves resume content
- Recalculates ATS score
- Returns original + improved resume and analyses

/generate-cover-letter
- Generates targeted cover letter from resume inputs and job description

/generate-resume-pdf
- Exports current resume as PDF

/generate-resume-docx
- Exports current resume as DOCX

/generate-cover-letter-docx
- Exports cover letter as DOCX

/create-checkout-session
- Creates Stripe Checkout session for Pro package

ENVIRONMENT VARIABLES
---------------------
The backend should use environment variables for secrets.

Required values:
- OPENAI_API_KEY
- STRIPE_SECRET_KEY

Do not hardcode these in source files for production.

Recommended local pattern:
- set environment variables in terminal
or
- load from .env using python-dotenv

LOCAL BACKEND RUNNING INSTRUCTIONS
----------------------------------
1. cd ~/ai-resume-platform/backend
2. source .venv/bin/activate
3. export OPENAI_API_KEY="your_key_here"
4. export STRIPE_SECRET_KEY="your_key_here"
5. python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

Expected local backend URL:
- http://127.0.0.1:8000

MVP LOGIC VS FUTURE HARDENING
-----------------------------

Current MVP logic:
- frontend stores Pro access in localStorage
- backend creates Stripe checkout session
- successful payment redirect unlocks premium mode client-side

Future hardening:
- store real entitlement server-side
- verify payment status through Stripe webhooks
- avoid relying solely on frontend package state
- add account-based access control

KNOWN BACKEND LIMITATIONS
-------------------------
- current payment entitlement is still MVP-style
- no user account system yet
- no backend persistence layer for user history
- no saved resume history yet
- AI prompt logic may still need refinement for uniqueness and tone preservation in Phase 2
- deployment configuration may still need final production hardening

BACKEND HANDOFF NOTES FOR THE NEXT DEVELOPER
--------------------------------------------
- Treat main.py as the API orchestration file
- Treat resume_service.py as the core AI logic file
- Preserve response shape consistency carefully
- Avoid changing endpoint response structures unless frontend is updated at the same time
- Be especially careful when editing:
  - /ats-score
  - /optimize-resume
  - /create-checkout-session
- These routes affect the most visible parts of the product


API ENDPOINTS
=============

Overview
--------
The frontend communicates with the backend exclusively through HTTP API routes.

These endpoints power:
- resume preview generation
- ATS analysis
- resume optimization
- cover letter generation
- file downloads
- Stripe checkout

The main request model used by most endpoints is:
- ResumeRequest

This request model includes:
- name
- email
- phone
- location
- skills
- experience
- education
- certifications
- job_description
- template

IMPORTANT
---------
The frontend depends on stable response shapes from these endpoints.
If the backend response format changes, frontend rendering may break.

------------------------------------------------------------
1. GET /
------------------------------------------------------------

Purpose:
- Simple health check route to verify backend is running.

Used by:
- manual testing
- deployment verification
- local development sanity check

Response:
{
  "message": "AI Resume Platform backend is running"
}

------------------------------------------------------------
2. POST /generate-resume
------------------------------------------------------------

Purpose:
- Generate a structured resume from user input.

Used by:
- currently optional / fallback flow
- most main preview logic currently uses /ats-score instead

Request body:
ResumeRequest JSON

Main backend flow:
1. Receive user form input
2. Pass input to resume_service.generate_resume_content()
3. Return structured resume JSON

Response:
{
  "message": "Resume generated",
  "resume": {
    "full_name": "...",
    "location": "...",
    "phone": "...",
    "email": "...",
    "professional_summary": "...",
    "skills": [...],
    "professional_experience": [...],
    "education": [...],
    "certifications": [...]
  }
}

Frontend dependency:
- structured resume object

------------------------------------------------------------
3. POST /ats-score
------------------------------------------------------------

Purpose:
- Generate the resume preview and calculate ATS match analysis.

Used by frontend:
- Generate Resume Preview button

This is one of the most important API routes in the product.

Main backend flow:
1. Generate structured resume from user input
2. Flatten resume into ATS-searchable text
3. Compare resume keywords against job description keywords
4. Return resume + ATS analysis

Response:
{
  "resume": { ...structured resume... },
  "ats_analysis": {
    "ats_score": 86,
    "matched_keywords": [...],
    "missing_keywords": [...]
  }
}

Frontend features powered by this endpoint:
- Resume Preview
- ATS Match Score
- Matched Keywords
- Missing Keywords
- Initial premium analysis panels in Pro mode

IMPORTANT:
- Frontend expects response keys:
  - resume
  - ats_analysis

------------------------------------------------------------
4. POST /optimize-resume
------------------------------------------------------------

Purpose:
- Optimize an existing resume against the target job description.

Used by frontend:
- Improve Resume button

This is the most important premium route in the product.

Main backend flow:
1. Generate initial structured resume
2. Calculate initial ATS score
3. Pass resume + missing keywords + job description to resume optimizer
4. Recalculate ATS score on optimized version
5. If optimized score is worse, fall back to original resume
6. Return original and improved versions

Response:
{
  "original_resume": { ... },
  "original_ats_analysis": {
    "ats_score": ...,
    "matched_keywords": [...],
    "missing_keywords": [...]
  },
  "improved_resume": { ... },
  "improved_ats_analysis": {
    "ats_score": ...,
    "matched_keywords": [...],
    "missing_keywords": [...]
  }
}

Frontend features powered by this endpoint:
- Optimized resume preview
- ATS improvement delta
- ATS improvement summary
- Skill Gap Analysis
- Resume Strength Meter
- Before vs After comparison
- AI Rewrite Explanations

IMPORTANT:
- Frontend depends on these exact keys:
  - original_resume
  - original_ats_analysis
  - improved_resume
  - improved_ats_analysis

------------------------------------------------------------
5. POST /generate-cover-letter
------------------------------------------------------------

Purpose:
- Generate a targeted plain-text cover letter from user input.

Used by frontend:
- Generate Cover Letter button

Main backend flow:
1. Receive ResumeRequest
2. Build cover letter prompt
3. Send prompt to OpenAI
4. Return plain-text cover letter

Response:
{
  "message": "Cover letter generated",
  "cover_letter": "..."
}

Frontend features powered by this endpoint:
- Cover letter preview

IMPORTANT:
- Frontend expects:
  - message
  - cover_letter

------------------------------------------------------------
6. POST /generate-resume-docx
------------------------------------------------------------

Purpose:
- Generate a downloadable DOCX version of the resume.

Used by frontend:
- Download DOCX button

Main backend flow:
1. Generate structured resume content
2. Apply selected template in docx_service
3. Save file to generated directory
4. Return file response

Response type:
- FileResponse
- filename: resume.docx

Frontend behavior:
- browser download begins automatically

IMPORTANT:
- frontend sends current form data again
- backend regenerates the resume before export

------------------------------------------------------------
7. POST /generate-resume-pdf
------------------------------------------------------------

Purpose:
- Generate a downloadable PDF version of the resume.

Used by frontend:
- Download PDF button

Main backend flow:
1. Generate structured resume content
2. Apply selected template in pdf_service
3. Save file to generated directory
4. Return file response

Response type:
- FileResponse
- filename: resume.pdf

Frontend behavior:
- browser download begins automatically

IMPORTANT:
- frontend sends current form data again
- backend regenerates the resume before export

------------------------------------------------------------
8. POST /generate-cover-letter-docx
------------------------------------------------------------

Purpose:
- Generate a downloadable DOCX version of the cover letter.

Used by frontend:
- Download Cover Letter DOCX button

Main backend flow:
1. Generate cover letter text
2. Pass content into cover_letter_docx_service
3. Save file to generated directory
4. Return file response

Response type:
- FileResponse
- filename: cover_letter.docx

Frontend behavior:
- browser download begins automatically

------------------------------------------------------------
9. POST /create-checkout-session
------------------------------------------------------------

Purpose:
- Create a Stripe Checkout session for the Pro package.

Used by frontend:
- Upgrade to Pro button

Main backend flow:
1. Create Stripe Checkout session with price data
2. Return hosted Stripe checkout URL

Response:
{
  "url": "https://checkout.stripe.com/..."
}

Frontend behavior:
1. fetch endpoint
2. receive Stripe URL
3. redirect browser to Stripe-hosted checkout page

Important configuration:
- uses STRIPE_SECRET_KEY from environment
- currently configured with local success / cancel URLs:
  - http://localhost:5500/success.html
  - http://localhost:5500/index.html

This must be updated for production deployment.

------------------------------------------------------------
10. GET /verify-pro
------------------------------------------------------------

Purpose:
- Placeholder endpoint for future entitlement verification.

Current use:
- MVP / future hardening support

Response:
{
  "pro": true
}

Notes:
- This is not a full production entitlement system yet
- current Pro unlock still relies on frontend localStorage after successful payment

REQUEST MODEL REFERENCE
=======================

ResumeRequest
-------------
Used by:
- /generate-resume
- /ats-score
- /optimize-resume
- /generate-cover-letter
- /generate-resume-docx
- /generate-resume-pdf
- /generate-cover-letter-docx

Fields:
- name: str
- email: str
- phone: str
- location: str
- skills: str
- experience: str
- education: str
- certifications: str
- job_description: str
- template: str

Allowed template values used by frontend:
- professional
- modern
- executive

FRONTEND → BACKEND FEATURE MAP
==============================

Generate Resume Preview
- POST /ats-score

Improve Resume
- POST /optimize-resume

Generate Cover Letter
- POST /generate-cover-letter

Download Resume PDF
- POST /generate-resume-pdf

Download Resume DOCX
- POST /generate-resume-docx

Download Cover Letter DOCX
- POST /generate-cover-letter-docx

Upgrade to Pro
- POST /create-checkout-session

API STABILITY NOTES FOR THE NEXT DEVELOPER
==========================================
1. Preserve response key names carefully.
2. The frontend expects structured resume JSON, not raw HTML.
3. ATS response must always include:
   - ats_score
   - matched_keywords
   - missing_keywords
4. Optimization response must always include both original and improved versions.
5. File endpoints must continue returning downloadable file responses.
6. Stripe checkout endpoint must continue returning:
   - { "url": "..." }

If these change, frontend script.js will need coordinated updates.


=========================================================

SECTION 5 — PAYMENT FLOW (STRIPE)

=========================================================

Purpose

Explain how the Pro upgrade payment system works in the current MVP.

The platform uses Stripe Checkout to process payments for the AI Resume Studio Pro package.

The payment system is intentionally lightweight to keep the MVP simple and fast to deploy.

⸻

=========================================================

PAYMENT FLOW OVERVIEW

=========================================================

The current payment process works as follows:
	1.	User clicks Upgrade to Pro on the frontend.
	2.	Frontend sends a request to the backend endpoint:

POST /create-checkout-session
	3.	Backend creates a Stripe Checkout session.
	4.	Stripe returns a secure hosted payment URL.
	5.	Frontend redirects the user to Stripe Checkout.
	6.	User completes payment on Stripe’s page.
	7.	Stripe redirects the user to:

success.html
	8.	The success page unlocks Pro features locally.

⸻

=========================================================

SYSTEM PAYMENT ARCHITECTURE

=========================================================

Frontend
→ POST /create-checkout-session
→ FastAPI Backend
→ Stripe Checkout API
→ Stripe Hosted Payment Page
→ Redirect to success.html
→ Pro features unlocked

⸻

=========================================================

BACKEND ENDPOINT

=========================================================

Route

POST /create-checkout-session

Location

backend/main.py

Responsibility

Create a Stripe checkout session and return the hosted payment URL.

Example Configuration

Currency:
USD

Product:
AI Resume Studio Pro Package

Price:
$29.00

Stripe expects the amount in cents:

unit_amount = 2900

⸻

=========================================================

BACKEND RESPONSE

=========================================================

Example response returned to the frontend:{
  "url": "https://checkout.stripe.com/c/pay/..."
}

The frontend immediately redirects the user to this URL.

⸻

=========================================================

FRONTEND PAYMENT TRIGGER

=========================================================

Location:

frontend/script.js

Flow:
	1.	User clicks Upgrade to Pro
	2.	Frontend sends request to /create-checkout-session
	3.	Backend returns Stripe payment URL
	4.	Browser redirects user to Stripe Checkout

Stripe handles the entire payment interface.

⸻

=========================================================

STRIPE CHECKOUT

=========================================================

Stripe’s hosted checkout page handles:

• card validation
• payment processing
• fraud protection
• PCI compliance
• payment confirmation
• receipt delivery

No payment information is processed or stored by your backend.

⸻

=========================================================

PAYMENT SUCCESS REDIRECT

=========================================================

After a successful payment, Stripe redirects the user to:

http://localhost:5500/success.html

⸻

=========================================================

SUCCESS PAGE LOGIC

=========================================================

The success page unlocks Pro features using localStorage.

Example logic:localStorage.setItem("proUser", "true")
window.location.href = "index.html"

=========================================================

PRO FEATURE ACCESS CONTROL

=========================================================

Location:

frontend/script.js

Example logic:const isProUser = localStorage.getItem("proUser")

if (!isProUser) {
    alert("Upgrade to Pro to use this feature.")
    return
}
This protects premium functionality such as:

• Resume Optimization
• Cover Letter Generation
• ATS improvement analysis
• Resume comparison viewer

⸻

=========================================================

WHY THIS DESIGN WAS CHOSEN FOR MVP

=========================================================

Advantages:

• extremely simple architecture
• no login system required
• no database required
• quick to deploy
• ideal for early product validation

Limitations:

• localStorage can be cleared
• user access is not verified server-side
• no user accounts yet

These limitations are acceptable for early-stage MVP testing.

⸻

=========================================================

FUTURE IMPROVEMENTS (POST-MVP)

=========================================================

Stripe Webhooks

Stripe will notify the backend when a payment succeeds.

Example:

Stripe → webhook → backend

The backend can then securely record payment status.

⸻

User Accounts

Future authentication options:

• email login
• magic link login
• OAuth providers

⸻

Server-Side Entitlement

Instead of using localStorage, the backend will verify Pro access.

Example endpoint:

GET /verify-pro

The backend will confirm whether the user has purchased Pro access.

⸻

Subscription Model

The platform may later move from:

one-time purchase

to

monthly subscription

using Stripe Subscriptions.

⸻

=========================================================

REQUIRED ENVIRONMENT VARIABLES

=========================================================

Stripe requires the following environment variable:

STRIPE_SECRET_KEY=sk_test_...

Important:

Never commit the Stripe secret key to version control.

It should be stored in:

• .env
• environment variables
• deployment platform secrets

⸻

=========================================================

FRONTEND SERVER REQUIREMENT

=========================================================

The frontend must be served through an HTTP server.

Opening HTML files directly will break Stripe redirects.

Correct method:cd frontend
python3 -m http.server 5500

Then open:

http://localhost:5500

⸻

=========================================================

PAYMENT FLOW SUMMARY

=========================================================

Upgrade Button
→ /create-checkout-session
→ Stripe Checkout
→ Payment Completed
→ Redirect to success.html
→ localStorage.proUser = true
→ Pro features enabled

⸻

=========================================================

IMPORTANT FOR DEVELOPERS

=========================================================

Do not change the following without updating the frontend:

• /create-checkout-session response format
• Stripe success_url
• Stripe cancel_url

The frontend payment logic depends on these values.

=========================================================

SECTION 6 — FRONTEND ARCHITECTURE

=========================================================

Purpose

Explain how the frontend of the AI Resume Platform is structured and how it connects to the backend.

The frontend is responsible for:
	•	collecting user input
	•	sending requests to backend endpoints
	•	rendering resume previews
	•	displaying ATS analysis
	•	showing advanced insight panels
	•	controlling template selection
	•	handling Free vs Pro feature access
	•	triggering Stripe checkout
	•	starting file downloads

The frontend is a static app built with:
	•	HTML
	•	CSS
	•	Vanilla JavaScript

⸻

=========================================================

FRONTEND FILE STRUCTURE

=========================================================

Main frontend files:
	•	frontend/index.html
	•	frontend/styles.css
	•	frontend/script.js
	•	frontend/success.html

File responsibilities

index.html
Defines the page structure and UI containers.

Contains:
	•	package gate UI
	•	resume form
	•	template selector
	•	action buttons
	•	resume preview panel
	•	ATS analysis panel
	•	advanced insight sections
	•	cover letter preview section

styles.css
Controls visual appearance.

Contains styling for:
	•	page layout
	•	form controls
	•	template cards
	•	resume preview
	•	ATS panels
	•	comparison viewer
	•	cover letter box
	•	package gate
	•	premium lock styling

script.js
Main frontend controller file.

Handles:
	•	DOM references
	•	frontend state
	•	package gate logic
	•	template switching
	•	API calls
	•	ATS rendering
	•	advanced insight rendering
	•	cover letter rendering
	•	download actions
	•	Stripe checkout

success.html
Handles successful payment redirect.

Responsibilities:
	•	mark the user as Pro using localStorage
	•	redirect back to index.html

⸻

=========================================================

FRONTEND LAYOUT OVERVIEW

=========================================================

The main page is divided into two major areas:

Left Panel

Used for user input and actions.

Contains:
	•	package selector
	•	upgrade button
	•	resume form
	•	template selector
	•	generate button
	•	premium action buttons
	•	loading state
	•	status messages

Right Panel

Used for rendering outputs and analysis.

Contains:
	•	resume preview
	•	ATS analysis
	•	skill gap analysis
	•	resume strength meter
	•	before vs after comparison
	•	AI rewrite explanations
	•	cover letter preview

⸻

=========================================================

FRONTEND STATE MODEL

=========================================================

The frontend uses lightweight in-memory state.

Important state variables in script.js include:
	•	latestFormData
	•	latestMatchedKeywords
	•	currentPackage

latestFormData

Stores the most recent form submission so the app can reuse it for:
	•	optimization
	•	cover letter generation
	•	file downloads

latestMatchedKeywords

Stores the most recent ATS matched keywords so the resume preview can highlight them.

currentPackage

Tracks whether the current user is in:
	•	Free mode
	•	Pro mode

Current Pro persistence is based on:
	•	localStorage

⸻

=========================================================

RESUME GENERATION FLOW

=========================================================

Trigger

User clicks:

Generate Resume Preview

Frontend process
	1.	Read form values
	2.	Build request payload
	3.	Send POST request to:

/ats-score
	4.	Receive:

	•	structured resume
	•	ATS analysis

	5.	Render results on the right panel

Frontend functions involved
	•	getFormData()
	•	form submit event listener
	•	renderResumePreview()
	•	renderATS()

Backend dependency

This flow depends on the backend returning:
	•	resume
	•	ats_analysis

⸻

=========================================================

ATS ANALYSIS FLOW

=========================================================

The ATS panel is rendered from the /ats-score response.

Displayed data includes:
	•	ATS score
	•	matched keywords
	•	missing keywords

UI areas updated
	•	ATS score circle
	•	matched keywords list
	•	missing keywords list
	•	keyword status message

Important rendering functions
	•	renderATS()
	•	renderKeywordPills()

⸻

=========================================================

RESUME OPTIMIZATION FLOW

=========================================================

Trigger

User clicks:

Improve Resume

Frontend process
	1.	Use stored latestFormData
	2.	Send POST request to:

/optimize-resume
	3.	Receive:

	•	original resume
	•	original ATS analysis
	•	improved resume
	•	improved ATS analysis

	4.	Update preview and advanced panels

Frontend features powered by this flow
	•	improved resume preview
	•	ATS score delta
	•	ATS improvement summary
	•	skill gap analysis
	•	resume strength meter
	•	before vs after comparison
	•	rewrite explanations

Important rendering functions
	•	renderResumePreview()
	•	renderScoreComparison()
	•	renderImprovementSummary()
	•	renderSkillGapAnalysis()
	•	renderResumeStrengthMeter()
	•	renderResumeComparison()
	•	renderRewriteExplanations()

⸻

=========================================================

COVER LETTER FLOW

=========================================================

Trigger

User clicks:

Generate Cover Letter

Frontend process
	1.	Use stored latestFormData
	2.	Send POST request to:

/generate-cover-letter
	3.	Receive plain-text cover letter
	4.	Render formatted preview

Important rendering function
	•	renderCoverLetter()

The frontend is responsible for converting plain text into a styled cover letter preview block.

⸻

=========================================================

TEMPLATE SYSTEM

=========================================================

The app currently supports three templates:
	•	Professional
	•	Modern
	•	Executive

Template selection behavior

The selected template affects:
	•	resume preview styling
	•	export styling
	•	subtitle behavior
	•	skill display style
	•	role display layout

Free vs Pro template access

Free:
	•	Professional only

Pro:
	•	Professional
	•	Modern
	•	Executive

Important template functions
	•	setActiveTemplateCard()
	•	applyPreviewTemplateClass()
	•	estimateSubtitle()

Template note display

The frontend updates the template description shown below the selector.

⸻

=========================================================

ADVANCED INSIGHT PANELS

=========================================================

These panels are designed to make the product feel more premium and explain the value of optimization.

1. Skill Gap Analysis

Displays:
	•	strong matches
	•	partial matches
	•	skill gaps

Main function:
	•	renderSkillGapAnalysis()

⸻

2. Resume Strength Meter

Displays:
	•	keyword match
	•	clarity
	•	impact
	•	structure
	•	professional tone

Main function:
	•	renderResumeStrengthMeter()

⸻

3. Before vs After Comparison

Displays:
	•	original summary
	•	improved summary
	•	top skills
	•	key experience bullets

Main function:
	•	renderResumeComparison()

⸻

4. AI Rewrite Explanations

Explains why the optimized version changed.

Main function:
	•	renderRewriteExplanations()

⸻

=========================================================

DOWNLOAD FLOW

=========================================================

The frontend supports three download actions:
	•	Resume PDF
	•	Resume DOCX
	•	Cover Letter DOCX

Frontend process
	1.	Use stored latestFormData
	2.	Send POST request to appropriate export endpoint
	3.	Receive file blob
	4.	Trigger browser download

Main function
	•	downloadFile()

Important note

The frontend does not store the generated file permanently.
It requests a new export from the backend each time a download button is clicked.

⸻

=========================================================

PACKAGE GATE (FREE VS PRO)

=========================================================

The app includes a feature gate that separates Free and Pro functionality.

Free mode

Allowed:
	•	Resume preview
	•	ATS score
	•	Professional template

Blocked:
	•	Resume optimization
	•	Cover letter generation
	•	advanced ATS insight panels
	•	all template options beyond Professional
	•	premium downloads

Pro mode

Unlocked:
	•	Resume optimization
	•	Cover letter generation
	•	all templates
	•	skill gap analysis
	•	resume strength meter
	•	before vs after comparison
	•	rewrite explanations
	•	downloads

Important gate functions
	•	isPro()
	•	setActivePackage()
	•	updatePremiumLocks()
	•	premiumBlockedMessage()

⸻

=========================================================

STRIPE PAYMENT TRIGGER (FRONTEND SIDE)

=========================================================

The Upgrade button is handled entirely from the frontend.

Flow
	1.	User clicks Upgrade to Pro
	2.	Frontend sends POST request to:

/create-checkout-session
	3.	Backend returns Stripe URL
	4.	Browser redirects user to Stripe

Main frontend logic

Handled in script.js through the upgrade button click event.

⸻

=========================================================

SUCCESS PAGE FLOW

=========================================================

After Stripe payment succeeds, user is redirected to:

success.html

This page:
	1.	sets a localStorage flag
	2.	redirects user back to index.html

This is the current MVP mechanism for enabling Pro mode.

⸻

=========================================================

FRONTEND RESET / UI STATE MANAGEMENT

=========================================================

Before new generation or optimization actions, the frontend resets old UI panels to avoid stale data.

Examples of reset helpers:
	•	resetScoreComparison()
	•	resetKeywordStatus()
	•	resetSkillGapAnalysis()
	•	resetStrengthMeter()
	•	resetResumeComparison()
	•	resetRewriteExplanations()
	•	resetCoverLetter()

These prevent previous results from remaining visible during new requests.

⸻

=========================================================

ERROR HANDLING AND LOADING STATES

=========================================================

The frontend includes lightweight user feedback through:
	•	loading indicators
	•	disabled buttons during requests
	•	success/error status messages

Main helpers
	•	showLoading()
	•	hideLoading()
	•	setStatus()
	•	getErrorMessage()

This improves the user experience during API calls.

⸻

=========================================================

LOCAL FRONTEND RUNNING REQUIREMENT

=========================================================

The frontend must be served through an HTTP server.

Do not open index.html directly with file://.

Correct method:cd frontend
python3 -m http.server 5500

Then open:

http://localhost:5500

This is especially important for:
	•	Stripe redirect flow
	•	API connectivity
	•	success page redirects

⸻

=========================================================

IMPORTANT FRONTEND DEPENDENCIES

=========================================================

The frontend depends on:
	•	correct DOM element IDs in index.html
	•	stable backend response structures
	•	correct API_BASE_URL in script.js
	•	success.html being accessible through an HTTP server
	•	backend running on the expected local or deployed URL

If any of these change, frontend behavior may break.

⸻

=========================================================

FRONTEND HANDOFF NOTES FOR THE NEXT DEVELOPER

=========================================================
	1.	script.js is currently the most important frontend file.
	2.	Many UI systems depend on shared state variables.
	3.	Do not change element IDs in index.html without updating script.js.
	4.	Do not change backend response formats without coordinating frontend updates.
	5.	Free vs Pro gating is currently MVP-style and frontend-heavy by design.
	6.	Template switching, ATS panels, and comparison panels are all tightly connected to the backend response shape.
	7.	The frontend is stable for MVP, but future modularization can happen after deployment stability.

    