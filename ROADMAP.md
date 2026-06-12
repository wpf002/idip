# IDIP — Roadmap & Architecture Decisions

A mobile platform for venue door staff that scans U.S. driver's licenses,
passports, and international IDs in under 2 seconds, runs a 50-state fraud +
age-verification engine, optionally challenges suspicious matches, and produces
a legally defensible **ALLOW / REVIEW / DENY** decision with a full audit trail.

---

## Architecture (thin client + backend)

The iPhone app is a **thin client**. It captures the PDF417 barcode / MRZ and
sends the raw string to the **FastAPI backend**, which does all of the real
work — parsing, 50-state rule validation, age/expiration checks, fraud and
risk scoring, the decision, and the compliance audit log — and returns the
result. The phone only renders the decision.

- **Mobile:** React Native 0.74.5 (no Expo) — vision-camera, keychain, op-sqlite, Zustand
- **Backend:** FastAPI (async), SQLAlchemy, Postgres (SQLite for tests/dev), Redis (with in-memory fallback)

---

## Decision: Authentication & provisioning model

**Door staff authenticate as themselves only — name + 4-digit PIN.** They never
enter (or see) the backend URL or the venue's API key. Those are **deployment
configuration**, provisioned ahead of time.

### Current implementation (single-venue / dev build)
- **API URL** and **venue API key** are build-time constants in
  [`mobile/src/config.ts`](mobile/src/config.ts). To target a different venue,
  change `API_KEY` (and `API_URL` once deployed) and rebuild.
- The **Setup screen** collects only **Name + PIN** (saved to the iOS Keychain).
- `mobile/src/store/authStore.ts` reads URL/key from config; it persists only
  the staff name + hashed PIN.

### Known tradeoff
- Baking the API key into the app means it ships **inside the binary**
  (extractable by a determined attacker). Acceptable for a single-venue or dev
  build; not ideal for a large multi-venue fleet.

### Future production-grade options (pick when deploying at scale)
1. **Manager activation** — a one-time per-device flow where a venue
   manager enters a short **activation/venue code**; the device exchanges it
   with the backend for that venue's key. Door staff thereafter only PIN.
2. **Real login / SSO** — staff log in against backend-managed staff records
   (the `staff` table + PIN hashes already exist); the device receives a
   short-lived, per-user token instead of a static venue key.
3. Keep keys server-side and issue **rotating, scoped tokens** so a leaked
   build credential can be revoked without reshipping the app.

---

## Current status (built & verified)

- ✅ FastAPI backend — full 12-step scan pipeline, 50 states + DC rule files,
  fraud detection, risk scoring, face challenge, audit logging, POS webhook.
  **112 pytest tests passing.**
- ✅ React Native app — all screens, stores, typed API client. **21 Jest tests passing.**
- ✅ Native iOS project builds, signs (Personal Team), installs, and **runs on a
  physical iPhone** (Release build, self-contained JS bundle).
- ✅ Local backend reachable from the device over the LAN (NSAllowsLocalNetworking).

---

## Outstanding / next steps

1. **Deploy the backend** to a fixed HTTPS domain; set `API_URL` to it (removes
   the local-IP / same-Wi-Fi requirement and the need for a dev tunnel).
2. **Multi-venue auth** — implement manager activation or login (see decision above).
3. **Apple Developer Program ($99/yr)** — removes the 7-day free-team expiry;
   enables TestFlight / App Store.
4. **Verify PDF417 scanning on-device** end to end (camera → decision).
5. **POS webhook retry queue** — Redis backoff (5s → 30s → 5min), dead-letter log.
6. **MRZ auto-OCR** — currently manual entry only; needs a commercial SDK
   (BlinkID / Scandit) — defer until revenue justifies the cost.
7. **MetricsScreen period toggle** polish (Tonight / Week / Month).

---

## Local dev quickstart

```bash
# Backend
cd backend && DATABASE_URL=sqlite+aiosqlite:///./idip_dev.db REDIS_URL="" \
  .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8080
# Create a venue → returns its API key (put it in mobile/src/config.ts)
curl -X POST http://localhost:8080/admin/location -H 'Content-Type: application/json' \
  -d '{"name":"My Venue","state_code":"TX"}'

# Mobile (device build/install handled via xcodebuild + devicectl; see mobile/README.md)
cd mobile && npm test    # Jest
```

See [`mobile/README.md`](mobile/README.md) for the full on-device build/run steps.
