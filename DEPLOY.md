# Deploying the IDIP backend

The backend is a Dockerized FastAPI app. It needs Postgres and a few env vars,
and it auto-rewrites the provider's `postgres://` URL to the async driver, so it
runs on any host. Below is **Railway** (preferred); a Render Blueprint
(`render.yaml`) is also in the repo as an alternative.

## Railway

1. Sign in at **https://railway.app** and connect GitHub.
2. **New Project → Deploy from GitHub repo →** select `idip`.
3. Open the created service → **Settings → Root Directory → `backend`**
   (so it uses `backend/Dockerfile` + `backend/railway.toml`).
4. In the project, **New → Database → PostgreSQL** (adds a `Postgres` service).
5. On the **app service → Variables**, add:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference variable) |
   | `SECRET_KEY` | a long random string — `openssl rand -hex 32` |
   | `HMAC_SECRET` | another `openssl rand -hex 32` (keep stable) |
   | `REDIS_URL` | *(leave empty)* — uses the in-memory cache |
   | `SCAN_RETENTION_DAYS` | `365` |
   Railway injects `PORT` automatically; the Dockerfile binds to it.
6. **Settings → Networking → Generate Domain** → you get
   `https://<name>.up.railway.app`. Open `/health` to confirm.

`⚠️ HMAC_SECRET` hashes document numbers for duplicate/repeat-offender
detection — set it once and don't change it, or past hashes won't match.

## Point the app at it

Once it's live, create a venue to get its API key:

```bash
curl -X POST https://<your-domain>/admin/location \
  -H 'Content-Type: application/json' \
  -d '{"name":"My Venue","state_code":"TX"}'
# -> {"id":..., "api_key":"idip_..."}
```

Put the domain + key in [`mobile/src/config.ts`](mobile/src/config.ts) and
rebuild the app. The phone then talks to the cloud backend over HTTPS on any
network — no more same-Wi-Fi / Mac-awake requirement.

## Notes

- Railway bills by usage (it has a small monthly free credit). Unlike a free
  Render instance it doesn't cold-start, but watch the usage credit.
- Every push to `main` redeploys automatically.

## Alternative: Render

`render.yaml` is a Blueprint: render.com → New → Blueprint → connect the repo →
Apply. Free tier, auto HTTPS, managed Postgres (sleeps after ~15 min idle; free
DB expires ~30 days).
