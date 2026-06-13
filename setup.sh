#!/bin/bash
# AI Resume Studio — One-time local setup script
# Run this once from the project root: bash setup.sh

set -e

echo ""
echo "==================================="
echo "  AI Resume Studio — Local Setup"
echo "==================================="
echo ""

# ── Backend ──────────────────────────────────────────────
echo "▶ Setting up Python backend..."
cd backend

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  echo "  ✓ Virtual environment created"
else
  echo "  ✓ Virtual environment already exists"
fi

source .venv/bin/activate
python3 -m pip install -r requirements.txt --quiet
echo "  ✓ Python dependencies installed"
cd ..

# ── Frontend ─────────────────────────────────────────────
echo ""
echo "▶ Setting up React frontend..."
cd frontend-app
npm install --silent
echo "  ✓ Node dependencies installed"
cd ..

# ── Done ─────────────────────────────────────────────────
echo ""
echo "==================================="
echo "  Setup complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Add your Anthropic API key to backend/.env"
echo "     → Get it at: console.anthropic.com"
echo ""
echo "  2. Start the app with VS Code:"
echo "     Terminal menu → Run Task → Start All"
echo ""
echo "     Or manually:"
echo "     Backend:  cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000"
echo "     Frontend: cd frontend-app && npm run dev"
echo ""
echo "  3. Open: http://localhost:5173"
echo ""
