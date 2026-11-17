> **RGPD 2026 update — ARCHIVED DESIGN ONLY (17 Nov 2026).** Backend endpoints, Vercel Cron, operator-token cloud sync and its persistent database pilot have been removed from the deployed project. BARUNA currently uses `data/*.json` plus browser `localStorage` and user-controlled JSON backup/restore. The GitHub STAC updater is **manual workflow_dispatch** only during the competition to avoid uncontrolled production rebuilds. See [RGPD four-step guide](./RGPD_FOUR_STEP_DEMO.md). Nothing below this line is currently an active deployment procedure.

---

# BARUNA Sentinel — AOI cloud backend, catalog scheduler and verification history

Status: **code delivered; operator credentials not installed by code or repository**. This is a **single-operator experimental system**, not multi-user enterprise RBAC, validated subsidence monitoring, hazard alerts, or certification.

## Current browser workflow (works without secrets)

- Region: Semarang; up to 20 locally stored AOIs. Legacy localStorage key is kept, not migrated destructively.
- Draw or import polygon and click **Simpan AOI di browser**. A browser-local registry is local to that browser and device.
- Click **Check Evidence** to compare metadata source snapshots from `data/semarang-monitoring-catalog.json` when `status=READY`, otherwise the last validated original static index `data/semarang-sentinel-scenes.json`.
- Each check saves an AOI-specific bounded history of 20 metadata-only events (not physical movement).
- Offline/browser fallback remains functional when API or cloud credentials are unavailable.

## Public catalog refresh pipeline

File: `.github/workflows/refresh-stac-catalog.yml`; triggered daily at **02:17 UTC = 09:17 WIB**, plus manual GitHub workflow dispatch. GitHub Actions scheduling is best effort, not precise. The workflow runs Python stdlib tests and `scripts/refresh_stac_catalog.py`, queries official [CDSE STAC](https://documentation.dataspace.copernicus.eu/APIs/STAC.html) for Sentinel-1 GRD and Sentinel-2 L2A, validates full responses and footprint rings, and publishes only public metadata into `data/semarang-monitoring-catalog.json` on `main`.

- No private AOI geometries are sent to the public catalog bot; public query uses fixed Semarang envelope.
- The bot uses a 90-day rolling lookback and bounded pagination. Errors, incomplete pages, invalid geometry, or empty results **stop publication**; old data survives.
- CATALOG CHECK reports *new scenes in the catalogue*, **not** deforestation, subsidence, flooding, or an asset measurement.
- GitHub Actions needs repository **Actions > General > Workflow permissions > Read and write permissions** to commit updated source snapshots. An organization policy can override this. If the bot fails, examine Actions logs; do not falsify a last-success time.
- Preview/production Vercel deployments may be triggered by catalog commits. Verify metadata publication and data-only tests before declaring monitoring live.

## Private AOI backend (optional; not configured by the code)

Backend routes use Vercel Functions (`api/`), the Upstash Redis REST API, and an operator-entered high-entropy access token. The token is **not** stored in browser localStorage or committed to Git. The API is same-origin only; no permissive CORS.

To activate, create an Upstash Redis database owned by Ourdo and set these **Vercel Project Environment Variables** in the `baruna-sentinel` project, production environment (do not paste credentials into ChatGPT):

- `UPSTASH_REDIS_REST_URL` — HTTPS URL from Upstash console.
- `UPSTASH_REDIS_REST_TOKEN` — the write-capable Redis REST token, server-only.
- `BARUNA_OPERATOR_TOKEN` — **random 32+ character high-entropy token** for one authorized operator; keep server-side. Configure it as an encrypted environment variable. Do not put it in the repository or `VITE_` frontend build variables.
- `CRON_SECRET` — **independent 32+ character random secret**, used solely to authenticate daily Vercel Cron. If absent, cron reports `BACKEND_NOT_CONFIGURED` and does no work. Do **not** reuse the operator token.

Set these in Vercel UI (`Project > Settings > Environment Variables`) and redeploy production. Access policy should also enable account/team 2FA, limited collaborator access, audit logs, and environment secret rotation. Use a dedicated Redis instance, not a general multi-tenant database.

**Check**: GET `/api/status` returns `{backendConfigured:true}` only when all three essential variables are present. If status is 404/503 or `backendConfigured:false`, operator cloud UI stays unavailable. It is intentional fail-closed behavior. Confirm that an anonymous GET to `/api/aoi` returns 401/503. Never add a client-side default token.

When backend is active, `Operator Cloud Sync` on `/aoi-registry.html` supports saving one selected AOI to cloud, loading authorized cloud AOIs without silently overwriting conflicting local geometry, and executing an authenticated backend source check. A token must be entered manually on each page load. No customer self-registration or per-user role management exists in this pilot.

## Server endpoints

- `GET /api/status` — public capability status only; no data or credential values.
- `GET /api/aoi` — operator-authenticated list.
- `POST /api/aoi` — operator-authenticated create/update; strict polygon validation and server-generated ID.
- `DELETE /api/aoi?id=<id>` — operator-authenticated deletion, plus history.
- `GET /api/aoi?history=<id>` — bounded monitoring events for an owned AOI, operator-authenticated.
- `POST /api/aoi-check` — operator-authenticated AOI-specific metadata check, event history only.
- `GET /api/cron/aoi-watch` — Vercel Cron, authorized only with `CRON_SECRET`. Scheduled **03:00 UTC / 10:00 WIB**, after the public catalog scheduled fetch. The schedule is approximate and depends on the plan's cron limits.

All server routes report an unavailable or unauthorized state rather than silently writing to an in-memory array. There is no long-lived background service in the browser.

## Source and evidence boundaries

The ranking cohort is `workspace + AOI + policy + observation window + evidence mode`. A registered AOI boundary is **user-declared/unverified**, not authoritative surveyed asset geometry. The backend's source check consumes the published public catalog and checks scene footprint intersection only. Sentinel-1 GRD is **not** InSAR, and Sentinel-2 L2A image metadata is **not** flood extent or subsidence. No physical movement rates, hazard scores, operational inspections, or alerts can be generated from this API.

A trustworthy asset-priority engine needs verified geometry, suitable and representative time-series measurements, uncertainty/methodology checks, asset exposure and owner-approved criticality, and policy review. Until then, outputs remain `DATA_INSUFFICIENT` and verification requests.

## Operational limitations before any customer pilot

- Single operator token is temporary: implement SSO/OIDC, proper roles/tenant isolation, rate limiting, request audit identifiers, schema migrations and backups before client data.
- Upstash REST hash writes are not distributed transactions across concurrent AOI modifications; limit to one test operator until a transactional backend is deployed.
- The public data bot's GitHub schedule and private AOI Vercel Cron are independent. A new public catalog commit is not the same as an AOI check completing.
- Browser-saved AOIs are not automatically moved to cloud; manual opt-in import preserves user control.
- Source datasets, operational ranking and health claims need independent QA and expert approval.

## Verification commands

```
python3 -m unittest discover -s scripts -p 'test_refresh_stac_catalog.py'
node --test tests/aoi-monitor-client.test.js tests/aoi-backend.test.js
npm run check
```

The CI pipeline additionally tests all existing map, scientific guardrails, responsive navigation, and local AOI smoke checks.