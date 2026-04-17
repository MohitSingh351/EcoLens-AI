#!/usr/bin/env bash
set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
RESET="\033[0m"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

echo -e "\n${BOLD}${GREEN}╔══════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║        EcoLens AI  🌿           ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════╝${RESET}\n"

# ── Backend setup ──────────────────────────────────────────────────────────────
echo -e "${CYAN}▶  Setting up backend…${RESET}"
cd "$BACKEND"

if [ ! -d "venv" ]; then
  echo "   Creating Python virtual environment…"
  python3 -m venv venv
fi

source venv/bin/activate

echo "   Installing Python packages…"
pip install -r requirements.txt

# Copy .env if missing
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "\n${YELLOW}  ⚠  No .env file found.${RESET}"
  echo -e "${YELLOW}     Created backend/.env from template.${RESET}"
  echo -e "${YELLOW}     👉 Open backend/.env and set your GEMINI_API_KEY before uploading images.${RESET}\n"
fi

# Run Django migrations (harmless, no models)
python manage.py migrate --run-syncdb -q 2>/dev/null || true

echo -e "${GREEN}   ✓  Backend ready${RESET}"

# Start Django
echo -e "${CYAN}▶  Starting Django on http://localhost:8000 …${RESET}"
python manage.py runserver 8000 &
BACKEND_PID=$!

deactivate

# ── Frontend setup ─────────────────────────────────────────────────────────────
echo -e "${CYAN}▶  Setting up frontend…${RESET}"
cd "$FRONTEND"

if [ ! -d "node_modules" ]; then
  echo "   Installing npm packages (first run — this takes ~30 s)…"
  npm install --silent
else
  echo "   node_modules found, skipping npm install."
fi

echo -e "${GREEN}   ✓  Frontend ready${RESET}"

echo -e "\n${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  Backend  →  http://localhost:8000${RESET}"
echo -e "${BOLD}  Frontend →  http://localhost:5173${RESET}"
echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
echo -e "Press ${BOLD}Ctrl+C${RESET} to stop both servers.\n"

# Start Vite (foreground — Ctrl+C kills it, then we clean up Django)
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
cleanup() {
  echo -e "\n${RED}Shutting down…${RESET}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait $FRONTEND_PID
