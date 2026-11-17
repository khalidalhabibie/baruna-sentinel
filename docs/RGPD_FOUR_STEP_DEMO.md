# BARUNA Sentinel — Four-step RGPD demo (JSON + localStorage)
Status: prototype demo; **no backend**, cloud sync, per-AOI scheduler, real-asset risk rank or certified safety judgement.

## Open and demo
- Open `/proposal-demo.html` from `/workspaces.html`. The guided page can work with a static server and the JSON assets packaged in `dist/`.
- A documented Semarang study narrative and four distinct sections: **01 AOI -> 02 GNSS -> 03 Quality Gate -> 04 Evidence Brief**.
- Supporting source data is `data/semarang-proposal-demo.json`, `data/tanjung-emas-historical-field-evidence.json`, `src/published-cors.js`, `src/assessment.js`. Strict validation prevents fabricated source measurements replacing failed JSON fetches.

## Suggested 3–4 minute walkthrough
1. **AOI** (40 s): Open AOI Registry, draw a polygon or import a WGS84 GeoJSON in Semarang and save it. Use **Backup JSON** to download records; **Restore JSON** reimports on a different browser. AOI is user-declared, **not** an engineering-quality asset polygon.
2. **GNSS evidence** (45 s): Open RGPD Guided Demo. CSMG `-94.03 ± 4.92 mm/year`, CSEM `+3.23 ± 1.76 mm/year`, PPP 2021–2023 **as cited in RGPD proposal from Sitaningrum & Widjajanti (2024)**. Distinguish CSEM 2010–2021 GPS series and independently QC'd BAKO 2025 RINEX; never combine these as a single geodetic solution.
3. **Decision** (70 s): Select any of six *2005 historical study sectors*. Actual outcome remains `DATA_INSUFFICIENT` because surveyed sector geometry, representative current on-asset movement, exposure and approved criticality/policy are unavailable. Four explicitly **SYNTHETIC** examples show a policy from `src/assessment.js`: movement (0–2) + exposure (0–2) + criticality (0–2), with hard quality gates. They are **not** estimates for the real six sectors.
4. **Evidence Brief** (45 s): Download JSON or browser Print/Save PDF. Show provenance, periods, limits, reason for withholding ranks, and follow-up requests. JSON synthetic annex carries a separate `SYNTHETIC_POLICY_EXERCISE` label.

## Source expansion (17 November 2026)
- `data/tanjung-emas-published-evidence-addendum.json` adds six **published 2004 control-point coordinates/elevations** from Raharjo & Yosi (2017), Table 1. Their printed UTM coordinates are **NOT accepted as survey-verified assets**: TB 1 and TB 2 have virtually identical UTM positions despite different local coordinates; other transformation/datum uncertainties remain. No definitive pins are plotted. Check the original full text and source survey before georeferencing.
- One explicitly secondary, 2026 thesis abstract (Fuan Maharani, Universitas Trisakti) reports South Coaster Road ±725 m, road elevation +0.50–0.70 mLWS and maximum sea level +1.10 mLWS. This adds context for **exposure** only; it is not an on-asset GNSS position solution, current operator risk assessment, certified flood depth, surveyed road polygon or approved asset criticality.
- The names Coaster Street in a 2005 study and South Coaster Road in the 2026 thesis do not confirm identical surveyed segments; the link is pending field verification.
- The guided demo includes a collapsible historical benchmark table plus the source-linked Coaster context only when that historic sector is selected. Every report stays `DATA_INSUFFICIENT`. The ranking of fictional assets is unchanged.

## Dataset and science gaps relative to the original proposal
| Proposal methodology | Actual demo available | Missing for operational asset ranking |
|---|---|---|
| Data multi-GNSS & QC | CSEM historical, published CSMG/CSEM station-rate contrast, independent BAKO RINEX QC | Verified recent Semarang site series and current same-station multi-GNSS QC |
| Estimate NEU and uncertainty | Historical CSEM trend, published CSMG/CSEM station rates with proposal-reported uncertainty | Contemporary station-validated position solution, harmonized reference frame, continuous epochs |
| Evidence coverage/quality | Station-vs-asset gate and segregated source scope | Documented representativeness, sensor quality, independent geodetic review |
| Spatial context/assets | Copernicus DSM, optical imagery, chosen AOI boundary, old published field-study sectors | DEMNAS validated layer (optional for conceptual demo), official asset polygons, actual asset benchmarks, owner-approved criticality |
| Priority and explanation | 4 separate fictional assets and a report showing which evidence is missing | Approved field policy and measured on-asset data |

The original proposal explicitly says local data replay is acceptable for a prototype and does **not** require new GNSS receivers, new field survey or paid datasets for an MVP. Operational ranking is a **future capability** that requires verified on-asset evidence.

## Local-only persistence and replay
- `localStorage` key remains `baruna:semarang:aoi-registry:v1`; upgrading does not erase registered AOIs.
- Backup schema `baruna-local-aoi-backup-v1`. Restore is additive: duplicate IDs with identical geometry are skipped, geometry conflicts are **not overwritten**, and the 20-AOI limit remains.
- `Check Evidence` uses packaged `data/semarang-monitoring-catalog.json` only if validated as READY, else `data/semarang-sentinel-scenes.json`. This is **source-metadata inspection**, not physical change detection. `data/semarang-monitoring-catalog.json` remains explicit NOT_RUN unless a manual publisher run succeeds.
- The GitHub STAC update workflow is **workflow_dispatch only** during RGPD demo to prevent unplanned auto-deployments and exceeding Vercel build-rate quota. Cloud API and Vercel Cron are removed, with no database secrets required.

## Accepted demo behavior
- 2 published station records with clearly distinct rates and uncertainties.
- 6 historical Tanjung Emas sectors always `DATA_INSUFFICIENT`.
- 4 fictional assets only in a separately labeled simulation; a failed evidence gate cannot obtain an operational score.
- Evidence Brief download JSON and print, with research citations, data gaps and explicit false-claim prevention.
- Desktop and mobile browser QA; neither the main map nor local AOI registry depends on an authenticated backend.

## Traceability
- Original source: `09 — Proposal Asli BARUNA Sentinel RGPD 2026.pdf` supplied by team (Summary, Methodology 1–5, Future Potential).
- CSMG/CSEM published comparison: https://journal.ugm.ac.id/jgise/article/view/95957
- Historical Tanjung Emas levelling/GPR: https://journal.esdm.go.id/bomg/article/view/12755
- These sources represent station and study results at distinct periods, **not** surveyed modern asset velocities.
