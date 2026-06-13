# Root Dockerfile for Railway (and any host that uploads the repo root as the
# build context). It builds ONLY the backend service. A second, self-contained
# Dockerfile lives in backend/ for local `docker build` from inside that dir.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install deps first for layer caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Non-root user
RUN useradd --create-home --uid 1000 idip
COPY backend/ .
RUN chown -R idip:idip /app
USER idip

EXPOSE 8080
# Railway (and most PaaS) inject $PORT; fall back to 8080 locally.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
