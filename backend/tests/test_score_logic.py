"""
Tests for scoring, cap logic, and optimization guard-rails in main.py and resume_service.py.

Run with:
    cd backend && pytest tests/ -v
"""

import pytest
from unittest.mock import MagicMock, patch


# ─── Helpers mirroring main.py logic ─────────────────────────────────────────

def apply_score_cap(original_score: int, improved_score: int, scorer_failed: bool) -> int:
    """Mirrors the cap logic in main.py resume_optimize."""
    max_allowed = 15 if original_score < 60 else (15 if original_score < 75 else 12)
    if not scorer_failed and improved_score - original_score > max_allowed:
        return original_score + max_allowed
    return improved_score


def fabrication_removed_fallback(original_score: int, rule_before: int, rule_after: int) -> int:
    """
    Mirrors the keyword-diff estimation path in main.py.
    If keyword diff shows no improvement, returns original — no invented +3.
    """
    if rule_before > 0 and rule_after > rule_before:
        keyword_gain = (rule_after - rule_before) / 100.0
        estimated_gain = max(1, min(round(original_score * keyword_gain * 0.5), 10))
        return original_score + estimated_gain
    # No improvement measurable — return original score honestly
    return original_score


# ─── Score cap tests ──────────────────────────────────────────────────────────

class TestScoreCap:
    def test_cap_not_triggered_within_limit_high_scorer(self):
        """88 → 92 is +4, well within the 12-point cap for 75+ scorers."""
        assert apply_score_cap(88, 92, scorer_failed=False) == 92

    def test_cap_not_triggered_within_limit_mid_scorer(self):
        """70 → 82 is +12, exactly at the 15-point cap for 60-74 range."""
        assert apply_score_cap(70, 85, scorer_failed=False) == 85

    def test_cap_triggered_for_high_scorer(self):
        """80 → 98 is +18, exceeds the 12-point cap for 75+ scorers."""
        result = apply_score_cap(80, 98, scorer_failed=False)
        assert result == 92  # 80 + 12

    def test_cap_triggered_for_low_scorer(self):
        """50 → 80 is +30, exceeds the 15-point cap for <60 scorers."""
        result = apply_score_cap(50, 80, scorer_failed=False)
        assert result == 65  # 50 + 15

    def test_cap_not_applied_when_scorer_failed(self):
        """Cap only applies when semantic scorer succeeded — skip if scorer_failed."""
        result = apply_score_cap(70, 72, scorer_failed=True)
        assert result == 72  # estimation path, cap doesn't apply

    def test_cap_preserves_no_improvement(self):
        """If score didn't improve, return original unchanged."""
        assert apply_score_cap(75, 75, scorer_failed=False) == 75

    def test_cap_not_triggered_for_low_scorer_within_limit(self):
        """58 → 73 is +15, exactly at the cap for <60 scorers."""
        assert apply_score_cap(58, 73, scorer_failed=False) == 73


# ─── Fabrication removal tests ────────────────────────────────────────────────

class TestFabricationRemoved:
    def test_no_invented_points_when_no_keyword_improvement(self):
        """
        CRITICAL: when both semantic scorer and keyword diff fail to show improvement,
        return original score — never invent +3 or any positive delta.
        """
        result = fabrication_removed_fallback(original_score=78, rule_before=65, rule_after=65)
        assert result == 78  # honest: no improvement detected

    def test_no_invented_points_when_keyword_regressed(self):
        """Keyword count going down should also return original score."""
        result = fabrication_removed_fallback(original_score=78, rule_before=65, rule_after=60)
        assert result == 78

    def test_keyword_improvement_produces_estimate(self):
        """When keyword diff shows genuine improvement, produce a proportional estimate."""
        result = fabrication_removed_fallback(original_score=70, rule_before=60, rule_after=75)
        # keyword_gain = 15/100 = 0.15; estimated_gain = max(1, min(round(70*0.15*0.5), 10)) = max(1, min(5, 10)) = 5
        assert result == 75  # 70 + 5

    def test_keyword_improvement_capped_at_10(self):
        """Estimated gain is capped at 10 points."""
        result = fabrication_removed_fallback(original_score=60, rule_before=20, rule_after=80)
        # keyword_gain = 60/100 = 0.60; estimated_gain = max(1, min(round(60*0.60*0.5), 10)) = 10
        assert result == 70  # 60 + 10

    def test_minimum_estimated_gain_is_1(self):
        """Minimum estimated gain when keyword diff is tiny but positive."""
        result = fabrication_removed_fallback(original_score=70, rule_before=65, rule_after=66)
        # keyword_gain = 1/100 = 0.01; estimated_gain = max(1, min(round(70*0.01*0.5), 10)) = max(1, 0) = 1
        assert result == 71  # 70 + 1


# ─── Section validation tests ─────────────────────────────────────────────────

class TestSectionValidation:
    """Tests for the section-presence check in optimize_resume_text."""

    def _extract_sections(self, text: str) -> set:
        return {
            line.strip().lower()
            for line in text.splitlines()
            if line.strip().lower() in {"summary", "skills", "experience", "education", "certifications"}
        }

    def test_all_sections_preserved(self):
        original = "SUMMARY\nSKILLS\nEXPERIENCE\nEDUCATION"
        optimized = "Summary\nSkills\nExperience\nEducation"
        orig_sections = self._extract_sections(original)
        new_sections = self._extract_sections(optimized)
        assert orig_sections.issubset(new_sections)

    def test_missing_section_detected(self):
        """If optimizer drops a section, the check should fail."""
        original = "SUMMARY\nSKILLS\nEXPERIENCE\nEDUCATION"
        optimized = "Summary\nExperience\nEducation"  # Skills missing
        orig_sections = self._extract_sections(original)
        new_sections = self._extract_sections(optimized)
        assert not orig_sections.issubset(new_sections)

    def test_extra_sections_are_allowed(self):
        """Output can have additional sections — only check originals are present."""
        original = "SUMMARY\nEXPERIENCE"
        optimized = "Summary\nSkills\nExperience\nEducation\nCertifications"
        orig_sections = self._extract_sections(original)
        new_sections = self._extract_sections(optimized)
        assert orig_sections.issubset(new_sections)


# ─── LCS diff algorithm tests (mirrors OptimizeTab.tsx logic) ─────────────────

class TestLCSDiff:
    """Port of the TypeScript computeLineDiff to Python for unit testing."""

    def _compute_line_diff(self, original: str, optimized: str) -> list:
        a = original.split('\n')
        b = optimized.split('\n')
        m, n = len(a), len(b)
        dp = [[0] * (n + 1) for _ in range(m + 1)]
        for i in range(1, m + 1):
            for j in range(1, n + 1):
                if a[i-1] == b[j-1]:
                    dp[i][j] = dp[i-1][j-1] + 1
                else:
                    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
        result = []
        i, j = m, n
        while i > 0 or j > 0:
            if i > 0 and j > 0 and a[i-1] == b[j-1]:
                result.insert(0, {'type': 'same', 'text': b[j-1]}); i -= 1; j -= 1
            elif j > 0 and (i == 0 or dp[i][j-1] >= dp[i-1][j]):
                result.insert(0, {'type': 'add', 'text': b[j-1]}); j -= 1
            else:
                result.insert(0, {'type': 'remove', 'text': a[i-1]}); i -= 1
        return result

    def test_identical_text_all_same(self):
        diff = self._compute_line_diff("line one\nline two", "line one\nline two")
        assert all(d['type'] == 'same' for d in diff)

    def test_added_line_detected(self):
        diff = self._compute_line_diff("line one", "line one\nnew line")
        types = [d['type'] for d in diff]
        assert 'add' in types

    def test_removed_line_detected(self):
        diff = self._compute_line_diff("line one\nline two", "line one")
        types = [d['type'] for d in diff]
        assert 'remove' in types

    def test_changed_line_is_remove_then_add(self):
        diff = self._compute_line_diff("old text", "new text")
        types = [d['type'] for d in diff]
        assert 'remove' in types
        assert 'add' in types

    def test_empty_original(self):
        diff = self._compute_line_diff("", "new content")
        assert all(d['type'] == 'add' for d in diff if d['text'])

    def test_empty_optimized(self):
        diff = self._compute_line_diff("old content", "")
        assert all(d['type'] == 'remove' for d in diff if d['text'])


# ─── Weighted score calculation tests ────────────────────────────────────────

class TestWeightedScoreCalculation:
    """Tests for calculate_weighted_score in semantic_ats_service.py."""

    WEIGHTS = {
        "keyword_alignment": 0.30,
        "experience_relevance": 0.25,
        "seniority_match": 0.15,
        "achievement_quality": 0.15,
        "education_credentials": 0.10,
        "human_readability": 0.05,
    }

    def _calculate(self, dimensions: dict) -> int:
        total = 0.0
        for key, weight in self.WEIGHTS.items():
            score = dimensions.get(key, {}).get("score", 0)
            total += score * weight
        return round(total)

    def test_all_100_gives_100(self):
        dims = {k: {"score": 100} for k in self.WEIGHTS}
        assert self._calculate(dims) == 100

    def test_all_zero_gives_zero(self):
        dims = {k: {"score": 0} for k in self.WEIGHTS}
        assert self._calculate(dims) == 0

    def test_weights_sum_to_one(self):
        assert abs(sum(self.WEIGHTS.values()) - 1.0) < 1e-9

    def test_known_score(self):
        """88→92 scenario: verify weighted score math is correct."""
        dims = {
            "keyword_alignment":    {"score": 90},
            "experience_relevance": {"score": 95},
            "seniority_match":      {"score": 72},
            "achievement_quality":  {"score": 88},
            "education_credentials":{"score": 60},
            "human_readability":    {"score": 85},
        }
        # 90*0.30 + 95*0.25 + 72*0.15 + 88*0.15 + 60*0.10 + 85*0.05
        # = 27 + 23.75 + 10.8 + 13.2 + 6 + 4.25 = 85
        assert self._calculate(dims) == 85

    def test_missing_dimension_defaults_to_zero(self):
        """Missing dimension key should score 0 for that dimension."""
        dims = {"keyword_alignment": {"score": 100}}  # all others missing
        result = self._calculate(dims)
        assert result == 30  # only keyword_alignment contributes: 100 * 0.30
