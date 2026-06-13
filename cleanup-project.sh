#!/bin/bash
# AI Resume Studio — Project Cleanup
# Removes all dead files identified in the audit.
# Run from the project root: bash cleanup-project.sh

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "======================================="
echo "  AI Resume Studio — Project Cleanup"
echo "======================================="
echo ""
echo "Root: $ROOT"
echo ""

# ── 1. Old vanilla HTML/JS frontend (pre-React prototype) ─
echo "▶ Removing old frontend/ prototype..."
rm -rf "$ROOT/frontend"
echo "  ✓ frontend/ deleted"

# ── 2. Root-level Node/TypeScript leftovers (dead Express server) ─
echo "▶ Removing root-level Node artifacts (old Express backend)..."
rm -f  "$ROOT/package.json"
rm -f  "$ROOT/package-lock.json"
rm -f  "$ROOT/tsconfig.json"
rm -rf "$ROOT/node_modules"
echo "  ✓ Root package.json, package-lock.json, tsconfig.json, node_modules/ deleted"

# ── 3. Backend generated test files ──────────────────────
echo "▶ Removing backend/generated/ test artifacts..."
rm -rf "$ROOT/backend/generated"
echo "  ✓ backend/generated/ deleted"

# ── 4. Dead backend service ───────────────────────────────
echo "▶ Removing unused backend service..."
rm -f "$ROOT/backend/services/docx_service.py"
echo "  ✓ backend/services/docx_service.py deleted"

# ── 5. Dead backend model ─────────────────────────────────
echo "▶ Removing unused backend model..."
rm -f "$ROOT/backend/models/resume_models.py"
echo "  ✓ backend/models/resume_models.py deleted"

# ── 6. Dead frontend pages ────────────────────────────────
echo "▶ Removing unused frontend pages..."
rm -f "$ROOT/frontend-app/src/pages/HomePage.tsx"
echo "  ✓ HomePage.tsx deleted"

# ── 7. Dead frontend API helpers ─────────────────────────
echo "▶ Removing unused frontend API files..."
rm -f "$ROOT/frontend-app/src/api/config.ts"
rm -f "$ROOT/frontend-app/src/api/http.ts"
echo "  ✓ api/config.ts and api/http.ts deleted"

# ── 8. Dead frontend components ──────────────────────────
echo "▶ Removing unused frontend components..."
rm -f "$ROOT/frontend-app/src/components/ResumePreviewCard.tsx"
echo "  ✓ ResumePreviewCard.tsx deleted"

# ── 9. Dead frontend renderer ─────────────────────────────
echo "▶ Removing unused template renderer..."
rm -f "$ROOT/frontend-app/src/features/resume-templates/renderers/ResumeTemplateRenderer.tsx"
echo "  ✓ ResumeTemplateRenderer.tsx deleted"

# ── 10. Empty folders ─────────────────────────────────────
echo "▶ Removing empty folders..."
rm -rf "$ROOT/docs"
rm -rf "$ROOT/scripts"
echo "  ✓ docs/ and scripts/ deleted"

# ── 11. One-time scripts (already run) ────────────────────
echo "▶ Removing one-time scripts..."
rm -f "$ROOT/install-react-pdf.sh"
echo "  ✓ install-react-pdf.sh deleted"
# Note: keeping cleanup-dead-code.sh would be circular — removing it too
rm -f "$ROOT/cleanup-dead-code.sh"
echo "  ✓ cleanup-dead-code.sh deleted"

# ── 12. .DS_Store files (macOS junk) ─────────────────────
echo "▶ Removing .DS_Store files..."
find "$ROOT" -name ".DS_Store" -not -path "*/.git/*" -delete
echo "  ✓ .DS_Store files removed"

# ── Done ─────────────────────────────────────────────────
echo ""
echo "======================================="
echo "  Cleanup complete!"
echo "======================================="
echo ""
echo "Removed:"
echo "  • frontend/           (old HTML/JS prototype)"
echo "  • node_modules/       (root — dead Express server)"
echo "  • package.json        (root)"
echo "  • package-lock.json   (root)"
echo "  • tsconfig.json       (root)"
echo "  • backend/generated/  (test PDF/DOCX artifacts)"
echo "  • docx_service.py     (unused service)"
echo "  • resume_models.py    (unused model)"
echo "  • HomePage.tsx        (unreachable page)"
echo "  • api/config.ts       (unused)"
echo "  • api/http.ts         (unused)"
echo "  • ResumePreviewCard.tsx (unused component)"
echo "  • ResumeTemplateRenderer.tsx (superseded by ResumePDF)"
echo "  • docs/, scripts/     (empty folders)"
echo "  • One-time shell scripts"
echo "  • .DS_Store files"
echo ""
echo "Your project is now clean. Run 'npx tsc --noEmit' in"
echo "frontend-app/ to confirm TypeScript is still happy."
echo ""
