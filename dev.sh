#!/usr/bin/env bash
# One-command local startup: Postgres + Redis + backend (hot reload).
set -euo pipefail

cd "$(dirname "$0")"

echo "▶ Starting Postgres (5433) and Redis (6380)…"
docker compose -f docker-compose.dev.yml up -d db redis

echo "▶ Installing backend deps…"
cd backend
python -m venv .venv 2>/dev/null || true
./.venv/bin/pip install -q -r requirements.txt

echo "▶ Running migrations…"
DATABASE_URL="postgresql+asyncpg://idip:idip@localhost:5433/idip" ./.venv/bin/alembic upgrade head || true

echo "▶ Starting backend on http://localhost:8080 …"
DATABASE_URL="postgresql+asyncpg://idip:idip@localhost:5433/idip" \
REDIS_URL="redis://localhost:6380/0" \
  ./.venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
