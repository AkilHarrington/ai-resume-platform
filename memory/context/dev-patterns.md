# Dev Patterns & Conventions

## Clipboard Delivery (for VS Code)
VS Code is "click" tier in computer-use — can't type into terminal directly.
**Pattern:** Open Finder first → write to clipboard → user switches to VS Code and pastes.
Alternative: write a shell script to the workspace folder, user runs it with `bash script.sh`.

## Python Import Check (in sandbox)
The venv uses macOS Python symlinks that don't resolve in the Linux sandbox.
**Use static grep instead:**
```bash
grep -rn "from services.X\|import X" backend --include="*.py" | grep -v ".venv"
```

## Running the Backend
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```
Use `python3 -m pip install -r requirements.txt` not `pip install` (pip not on PATH).

## File Deletion Pattern
Can't `rm` from sandbox (Operation not permitted on mounted volume).
Write a `cleanup-dead-code.sh` script to the workspace, user runs it.

## Graceful Degradation Rules
- All Claude API failures must return usable fallback responses — never crash
- Semantic scorer fallback: returns score 0 + "check API credits" message
- Optimize fallback: returns original resume text unchanged
- Cover letter fallback: returns empty string

## Anti-Hallucination Guards
- Semantic scorer: cross-checks Claude's weighted score vs computed score (uses Claude's if within 5pts)
- Optimizer: reverts to original text if score inflates more than allowed threshold
- Optimizer: validates output length (must be ≥50% of original) and section preservation

## Score Thresholds
- ATS ≥75: strong (green)
- ATS 55-74: moderate (amber)
- ATS <55: low (red)
- Score inflation guard: max +15pts if original <60, +12 if <75, +10 otherwise

## Pro Gate
- Backend: `GET /api/user/pro-status` → `{"isPro": bool}`
- Override: `FORCE_PRO=true` in `backend/.env` for local testing
- Frontend: `useQuery(['pro-status'], getProStatus)` in WorkspacePage
- UI: `UpgradePrompt` component shown when `!isPro` on pro tabs
- Real gate wires in when Supabase subscription check replaces the env override

## TypeScript
- All types live in `frontend-app/src/api/resumeApi.ts`
- `src/types/resumeSchema.ts` and `resumeTemplate.ts` are kept for the template renderer
- Run `npx tsc --noEmit` to verify after frontend changes
