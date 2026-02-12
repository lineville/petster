#!/usr/bin/env bash
set -euo pipefail

# ── Petster — Full Setup Script ──────────────────────────────────────────────
# Run from the project root after cloning:
#   chmod +x setup.sh && ./setup.sh
# ─────────────────────────────────────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✔ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }

# ── 1. Homebrew ──────────────────────────────────────────────────────────────
step "Checking Homebrew"
if ! command -v brew &>/dev/null; then
  echo -e "${RED}Homebrew is required. Install it from https://brew.sh${NC}"
  exit 1
fi
ok "Homebrew found"

# ── 2. PostgreSQL 16 ────────────────────────────────────────────────────────
step "Installing PostgreSQL 16"
brew list postgresql@16 &>/dev/null || brew install postgresql@16
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
brew services start postgresql@16 2>/dev/null || true
sleep 2
ok "PostgreSQL 16 running"

# ── 3. Create database & user ───────────────────────────────────────────────
step "Setting up petster database"
if ! psql -U petster -d petster -c "SELECT 1" &>/dev/null; then
  psql postgres -c "CREATE USER petster WITH PASSWORD 'petster';" 2>/dev/null || true
  psql postgres -c "CREATE DATABASE petster OWNER petster;" 2>/dev/null || true
  psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE petster TO petster;" 2>/dev/null || true
  ok "Created database & user"
else
  ok "Database already exists"
fi

# ── 4. Node.js 22 ───────────────────────────────────────────────────────────
step "Installing Node.js 22"
brew list node@22 &>/dev/null || brew install node@22
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
ok "Node.js $(node --version)"

# ── 5. Python venv & backend deps ───────────────────────────────────────────
step "Setting up Python virtual environment"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
  ok "Created .venv"
else
  ok ".venv already exists"
fi
source .venv/bin/activate
pip install -q -r requirements.txt
ok "Python dependencies installed"

# ── 6. npm install ───────────────────────────────────────────────────────────
step "Installing frontend dependencies"
npm install --silent
ok "npm packages installed"

# ── 7. .env file ────────────────────────────────────────────────────────────
step "Checking .env"
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    warn "Created .env from .env.example — fill in your API keys"
  else
    cat > .env <<'EOF'
DATABASE_URL=postgresql+psycopg://petster:petster@localhost:5432/petster
AZURE_VISION_ENDPOINT=
AZURE_VISION_KEY=
OPENAI_API_KEY=
APP_NAME=Petster API
DEBUG=true
EOF
    warn "Created .env with defaults — fill in your API keys"
  fi
else
  ok ".env exists"
fi

# ── 8. Seed the database ────────────────────────────────────────────────────
step "Seeding database"
python -m app.seed
ok "Database seeded"

# ── 9. Start servers ────────────────────────────────────────────────────────
step "Starting backend (port 8001)"
uvicorn app.main:app --reload --port 8001 &
BACKEND_PID=$!
sleep 2

step "Starting frontend (port 5173)"
npx vite --port 5173 &
FRONTEND_PID=$!
sleep 3

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🐾 Petster is running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "  Frontend:  ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend:   ${CYAN}http://localhost:8001${NC}"
echo -e "  API Docs:  ${CYAN}http://localhost:8001/docs${NC}"
echo -e ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop both servers."
echo ""

# Trap Ctrl+C to kill both servers
trap "echo -e '\n${YELLOW}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
