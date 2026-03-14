# =========================================================
# File: services/match_intelligence.py
# Purpose:
# Signal-Based Resume Match Intelligence v1
#
# Responsibilities:
# - evaluate resume/job-description overlap at the capability level
# - identify strength signals
# - identify opportunity signals
# - identify recruiter risk signals
# - generate a deterministic role-fit summary
# =========================================================

from __future__ import annotations

import re
from typing import Any


SIGNAL_DEFINITIONS: dict[str, dict[str, Any]] = {
    "leadership_ownership": {
        "label": "Leadership & Ownership",
        "keywords": {
            "lead", "led", "leading", "leadership",
            "manage", "managed", "manager", "management",
            "oversee", "oversaw", "oversight",
            "direct", "directed", "director",
            "supervise", "supervised",
            "own", "owned", "owner",
            "strategy", "strategic",
        },
    },
    "reporting_documentation": {
        "label": "Reporting & Documentation",
        "keywords": {
            "report", "reporting", "reports",
            "documentation", "documented", "documents",
            "dashboard", "dashboards",
            "records", "recordkeeping",
            "updates", "status", "tracking",
            "presentations", "presentation",
        },
    },
    "planning_coordination": {
        "label": "Planning & Coordination",
        "keywords": {
            "planning", "planned", "schedule", "scheduling",
            "coordination", "coordinated", "calendar",
            "timelines", "deliverables", "priorities",
            "roadmap", "workstreams",
        },
    },
    "workflow_execution": {
        "label": "Workflow & Process Execution",
        "keywords": {
            "workflow", "process", "processes",
            "execution", "operations", "operational",
            "procedures", "throughput", "efficiency",
            "delivery", "execution",
        },
    },
    "cross_functional_collaboration": {
        "label": "Cross-Functional Collaboration",
        "keywords": {
            "cross-functional", "cross-team", "collaboration",
            "collaborated", "partnered", "stakeholders",
            "departments", "teams", "internal teams",
        },
    },
    "metrics_impact": {
        "label": "Metrics & Measurable Impact",
        "keywords": {
            "metrics", "kpi", "kpis", "performance",
            "targets", "outcomes", "results",
            "improved", "reduced", "increased",
            "efficiency", "productivity",
            "%", "$",
        },
    },
    "strategy_improvement": {
        "label": "Strategy & Improvement",
        "keywords": {
            "strategy", "strategic", "improvement",
            "improve", "improved", "optimized", "optimization",
            "initiative", "initiatives", "transformation",
            "scale", "roadmap",
        },
    },
    "compliance_risk": {
        "label": "Compliance & Risk Awareness",
        "keywords": {
            "compliance", "regulatory", "regulations",
            "policy", "policies", "standards",
            "audit", "governance", "controls", "risk",
        },
    },
    "technical_systems": {
        "label": "Technical / Systems Capability",
        "keywords": {
            "systems", "platform", "software", "automation",
            "cloud", "api", "dashboard", "excel", "crm",
            "database", "tool", "tools",
        },
    },
    "stakeholder_support": {
        "label": "Stakeholder / Customer Support",
        "keywords": {
            "customer", "customers", "client", "clients",
            "stakeholder", "stakeholders", "support",
            "service", "services", "communication",
            "vendor", "partner",
        },
    },
}


def normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def split_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def keyword_in_text(keyword: str, text: str) -> bool:
    if keyword in {"%", "$"}:
        return keyword in text
    return keyword in text


def extract_experience_lines(parsed_resume: dict) -> list[str]:
    lines: list[str] = []

    for role in parsed_resume.get("professional_experience", []) or []:
        for bullet in role.get("description", []) or []:
            bullet_text = str(bullet).strip()
            if bullet_text:
                lines.append(bullet_text)

    return lines


def score_signal(
    signal_key: str,
    signal_def: dict[str, Any],
    resume_text: str,
    job_text: str,
    experience_lines: list[str],
) -> dict[str, Any]:
    keywords = signal_def["keywords"]

    resume_hits = sum(1 for kw in keywords if keyword_in_text(kw, resume_text))
    job_hits = sum(1 for kw in keywords if keyword_in_text(kw, job_text))
    bullet_hits = sum(
        1
        for line in experience_lines
        if any(keyword_in_text(kw, line.lower()) for kw in keywords)
    )

    resume_score = min(100, resume_hits * 18)
    job_relevance = min(100, job_hits * 22)
    bullet_score = min(100, bullet_hits * 25)

    score = round(
        (resume_score * 0.5) +
        (job_relevance * 0.3) +
        (bullet_score * 0.2)
    )

    evidence: list[str] = []
    for line in experience_lines:
        lowered = line.lower()
        if any(keyword_in_text(kw, lowered) for kw in keywords):
            evidence.append(line)
        if len(evidence) >= 3:
            break

    return {
        "key": signal_key,
        "label": signal_def["label"],
        "score": min(score, 100),
        "resumeHits": resume_hits,
        "jobHits": job_hits,
        "bulletHits": bullet_hits,
        "evidence": evidence,
    }


def build_role_fit_summary(
    role_fit_score: int,
    strength_signals: list[dict[str, Any]],
    opportunity_signals: list[dict[str, Any]],
    recruiter_risks: list[dict[str, Any]],
) -> str:
    if role_fit_score >= 85:
        intro = "Strong alignment with the target role."
    elif role_fit_score >= 65:
        intro = "Moderate alignment with the target role."
    else:
        intro = "Limited alignment with the target role."

    strengths = ", ".join(signal["label"] for signal in strength_signals[:2]).lower()
    opportunities = ", ".join(signal["label"] for signal in opportunity_signals[:2]).lower()

    summary_parts = [intro]

    if strengths:
        summary_parts.append(
            f"The resume shows strong evidence in {strengths}."
        )

    if opportunities:
        summary_parts.append(
            f"It could better demonstrate {opportunities}."
        )

    if recruiter_risks:
        summary_parts.append(
            f"Recruiter hesitation may come from {recruiter_risks[0]['label'].lower()}."
        )

    return " ".join(summary_parts).strip()


def build_recruiter_risk_signals(
    parsed_resume: dict,
    role_fit_score: int,
    signal_scores: dict[str, dict[str, Any]],
    resume_industry: str,
    job_industry: str,
) -> list[dict[str, Any]]:
    risks: list[dict[str, Any]] = []

    experience_lines = extract_experience_lines(parsed_resume)
    resume_text = normalize_text(
        " ".join([
            parsed_resume.get("professional_summary", "") or "",
            " ".join(parsed_resume.get("skills", []) or []),
            " ".join(experience_lines),
        ])
    )

    has_numbers = bool(re.search(r"\b\d+[%+]?\b|\$\d+", resume_text))

    if signal_scores["metrics_impact"]["score"] < 40 or not has_numbers:
        risks.append({
            "key": "limited_metrics",
            "label": "Limited measurable achievements",
            "severity": "medium",
            "explanation": "The resume describes responsibilities clearly, but shows limited quantified business impact.",
        })

    if signal_scores["leadership_ownership"]["score"] < 45:
        risks.append({
            "key": "unclear_ownership",
            "label": "Leadership scope unclear",
            "severity": "medium",
            "explanation": "The resume shows some responsibility, but ownership and decision-making scope are not strongly defined.",
        })

    if len(experience_lines) < 4:
        risks.append({
            "key": "thin_experience_depth",
            "label": "Experience depth appears thin",
            "severity": "medium",
            "explanation": "The experience section is sparse and may not give recruiters enough confidence in execution depth.",
        })

    if resume_industry != "general" and job_industry != "general" and resume_industry != job_industry:
        risks.append({
            "key": "domain_mismatch",
            "label": "Domain alignment is limited",
            "severity": "high",
            "explanation": "The resume appears strongest in a different industry than the target role.",
        })

    if role_fit_score < 60:
        risks.append({
            "key": "weak_role_language",
            "label": "Role-specific terminology is weak",
            "severity": "medium",
            "explanation": "The resume does not consistently reflect the vocabulary and capability signals emphasized by the job description.",
        })

    return risks[:3]


def build_match_intelligence(
    parsed_resume: dict,
    job_description: str,
    resume_industry: str,
    job_industry: str,
) -> dict[str, Any]:
    experience_lines = extract_experience_lines(parsed_resume)

    resume_text = normalize_text(
        " ".join([
            parsed_resume.get("full_name", "") or "",
            parsed_resume.get("professional_summary", "") or "",
            " ".join(parsed_resume.get("skills", []) or []),
            " ".join(experience_lines),
            " ".join(parsed_resume.get("education", []) or []),
            " ".join(parsed_resume.get("certifications", []) or []),
        ])
    )
    job_text = normalize_text(job_description)

    signal_scores: dict[str, dict[str, Any]] = {}

    for signal_key, signal_def in SIGNAL_DEFINITIONS.items():
        signal_scores[signal_key] = score_signal(
            signal_key=signal_key,
            signal_def=signal_def,
            resume_text=resume_text,
            job_text=job_text,
            experience_lines=experience_lines,
        )

    sorted_signals = sorted(
        signal_scores.values(),
        key=lambda item: item["score"],
        reverse=True,
    )

    strength_signals = [
        {
            "key": signal["key"],
            "label": signal["label"],
            "score": signal["score"],
            "evidence": signal["evidence"],
            "explanation": f"The resume shows clear evidence of {signal['label'].lower()}.",
        }
        for signal in sorted_signals
        if signal["score"] >= 55 and signal["jobHits"] > 0
    ][:4]

    opportunity_signals = [
        {
            "key": signal["key"],
            "label": signal["label"],
            "score": signal["score"],
            "evidence": signal["evidence"],
            "explanation": f"The job emphasizes {signal['label'].lower()}, but the resume shows weaker support for it.",
        }
        for signal in sorted(
            signal_scores.values(),
            key=lambda item: (item["jobHits"], -item["score"]),
            reverse=True,
        )
        if signal["jobHits"] > 0 and signal["score"] < 55
    ][:4]

    role_fit_score = round(
        sum(signal["score"] for signal in sorted_signals) / max(len(sorted_signals), 1)
    )

    recruiter_risk_signals = build_recruiter_risk_signals(
        parsed_resume=parsed_resume,
        role_fit_score=role_fit_score,
        signal_scores=signal_scores,
        resume_industry=resume_industry,
        job_industry=job_industry,
    )

    role_fit_summary = build_role_fit_summary(
        role_fit_score=role_fit_score,
        strength_signals=strength_signals,
        opportunity_signals=opportunity_signals,
        recruiter_risks=recruiter_risk_signals,
    )

    return {
        "roleFit": {
            "score": role_fit_score,
            "summary": role_fit_summary,
        },
        "strengthSignals": strength_signals,
        "opportunitySignals": opportunity_signals,
        "recruiterRiskSignals": recruiter_risk_signals,
    }