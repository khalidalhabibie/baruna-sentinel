# BARUNA Sentinel — BIG Bhumireka 2026

## Research Ranking Center — multi-scope workspaces & historical GNSS (18 Nov 2026)

**Open [Ranking Center](ranking-center.html)** and [AOI Registry](aoi-registry.html). This is a source-attributed demonstration with **three Semarang infrastructure sub-workspaces**, not a multi-city subsidence risk league. The rest of BARUNA's regional portfolio (Jakarta / Surabaya) remains explicitly without sufficient registered evidence.

- **Across workspaces:** compare proportion of two **catalog metadata categories** found inside manually checked AOIs; port/logistics, coastal industry, transport corridors, plus general AOIs. Denominator = 2 × AOI count. This is **not** satellite deformation, science QA completeness, physical exposure, or operational risk.
- **Inside one workspace:** compare catalog category presence for its individual AOIs, with tied ranks and unranked areas whose evidence checks are missing or have zero catalog categories.
- **Specific AOI:** show its declared study polygon, catalog evidence status, the geographically nearest published GNSS station, approximate distance, period, and source; **do not** use that station's rate as AOI displacement.
- **Independent GNSS station leaderboard:** 20 published vertical velocities with publication-reported uncertainties, period **2010–2021**, from Susilo et al. (2023) *Scientific Data*, [Table 2](https://doi.org/10.1038/s41597-023-02274-0), public source [Zenodo 7775016](https://doi.org/10.5281/zenodo.7775016). Local static source `data/gnss-published-2023-stations.geojson` was carried over from the research helper. CPKL is published at −107.0 mm/year and CSEM at −0.8 mm/year; **these are station observations**, not BARUNA's new 2026 Multi-GNSS results.
- **Separate publication:** UGM 2021–2023 PPP contrasts CSMG and CSEM, displayed as independent context. The two papers cannot be merged into one site-risk metric without aligning method, reference frame, period, and uncertainties.
- **Storage:** 3 example AOIs use clearly marked **illustrative rectangles**. Added/user-edited AOIs belong to a chosen Semarang infrastructure sub-workspace and persist in `localStorage` under the existing registry key; backup/restore JSON retains workspace assignment. No cross-device sync. No survey-grade asset geometries are claimed.
- **Future scientific gate:** operational AOI deformation/risk ranks remain `null` until temporally and spatially comparable, validated InSAR/levelling/GNSS evidence plus owner-approved asset geometry and criticality exist. **More source categories alone never unlock risk ranking.**

Implementation: `src/workspace-ranking-model.js`, `src/ranking-center.js`, `src/aoi-registry-model.js`, `src/aoi-infrastructure-cases.js`; scientific tests in `src/workspace-ranking-model.test.js`; browser QA in `scripts/ranking-center-smoke.mjs`, `scripts/aoi-registry-smoke.mjs` and targeted workflow `.github/workflows/ranking-center-qa.yml`. Deployment review is separate: creating the PR does not deploy production.

## Multi-GNSS-first Intelligence / evidence priorities (18 Nov 2026)

**Product scope:** BARUNA Sentinel's primary technical workflow is now Multi-GNSS evidence readiness for the Pusat Multi-GNSS-oriented demonstration, not an invented 2026 port asset-risk ranking. The new [Multi-GNSS Center](gnss-center.html) can be opened from the main SaaS sidebar, Portfolio Overview, or Semarang workspace. The Area Intelligence ranking pane links to the same *Evidence Review Priority* queue before showing a gated, unavailable asset risk ranking.

Only two processed public evidence streams are measured by this UI:
- **CSEM, Semarang**: source-derived GPS ENU positions, 3,561 daily epochs spanning 2010-01-13 to 2021-12-31, IGb14 / ITRF2014 historical context. Original source DOI: https://doi.org/10.5281/zenodo.7775016. No new 2026 displacement is calculated.
- **BAKO00IDN, Cibinong**: independently verified RINEX-derived Multi-GNSS QC sample, 41 epochs over a 20-minute window on 2025-01-01. Six constellations had observed pseudorange; this is **not** a positioning accuracy comparison and cannot validate Semarang movement. See `data/BAKO_IGS_2025-001_20min_qc_summary.json` and its originating GitHub Actions run.
- **CSMG, Semarang Genuk**: public BIG Ina-CORS station site-log metadata. Matched local CSEM/CSMG station-day QC may be loaded **privately** in the existing GNSS Lab at `evidence-lab.html?page=analyst`; raw/private RINEX and QC are **not** published to this SaaS build.

The queue's ordered steps are (1) paired CSEM/CSMG observation QC, (2) validated geodetic position processing and reference frame, (3) time-matched station comparison, and (4) surveyed asset linkage where appropriate. **Step order is a workflow dependency, never an asset hazard priority, station performance ranking, or GNSS accuracy claim.** Operational asset ranking remains disabled (0 eligible) until suitable validated evidence exists.

Scientific and UI implementation: `src/multi-gnss-evidence.js` (fail-closed provenance checks), `src/multi-gnss-evidence.test.js`, `src/saas-app.js`, `saas.css`, `gnss-center.html`. Browser regression in `scripts/saas-smoke.mjs`. Deployment status must be checked separately.


> **SaaS frontend (17 Nov 2026):** The `/` route is now a blue enterprise **Portfolio Overview**. Navigate via Workspaces → Semarang Coastal → Tanjung Emas Area Explorer → Data / Timeline / Intelligence / Reports, or take the shortcut through All Areas. `/workspaces.html` lists Semarang as the only source-backed workspace, with Jakarta and Surabaya as intentionally empty demo workspaces. `/data-catalog.html` lists source status without invented measurements. The original homepage and GNSS/evidence features are preserved at `/evidence-lab.html` (for GNSS, `/evidence-lab.html?page=analyst`). Existing advanced GIS remains `/real-workspace.html`. The source-backed Sentinel-2 true-color overlay uses validated real display pixels, and HyP3 QA / historical sources are separate. No annual 2026 asset subsidence is claimed. The SaaS shell is in `saas.css`, `src/saas-app.js`; browser test is `scripts/saas-smoke.mjs`. Deployment is managed separately.


> **Start here (Bhumireka 2026):** Open the homepage, choose **Periksa West Breakwater** or **Panduan 2 menit**, inspect the 2005 historical evidence and its **DATA INSUFFICIENT** outcome, then print an evidence-gated verification brief. This prototype is for defensible inspection *readiness*, not current asset safety ranking, live subsidence measurement, or flood prediction. The guided tour is first-visit/replayable and nonmodal. Advanced Overview/Detail/Compare tools remain under **Eksplorasi lainnya**. See [GIS reviewer product flow](docs/PRODUCT_FLOW_FOR_GIS_REVIEWERS.md) and [video capture guide](docs/VIDEO_CAPTURE_SYNTHETIC_DATA_PLAN.md).

Independent, offline-capable competition prototype. This repository does **not** import or depend on the existing BARUNA WebGIS application.

## Problem
Coastal infrastructure teams need an explainable **inspection-review queue**, not a misleading map implying that a nearby GNSS station measures every asset.

## Product promise: evidence that leads to a defensible next step

**Beranda (default)** is an evidence-first introduction and **Cek bukti** is the decision workspace that answers three plain-language questions: **What do we know? What can we *not* conclude? What should we verify next?** Historical sector records and their limitations come before the map. The OSM map remains interactive geographic context; it is not an asset risk surface or a surveyed-sector map.

**GNSS Analyst** is a separate technical workspace, starting with two independent proof-of-capability sources: the historic CSEM GPS-derived station series (Semarang, 2010–2021) and verified BAKO multi-GNSS observation QC (Cibinong, 1 Jan 2025). It then exposes position trends, source controls, spatial audit, and optional local CSEM / CSMG observation QC. The analyst must never imply BAKO verified CSEM displacement or site safety. View selection is handled by a standalone navigation script, so the two tabs still work even when the geospatial analysis module fails. Switching to an analyst opens its source context, not an empty optional import screen. Share a direct technical view with `?view=analyst`. Use **Enable experimental tools** to reveal local Ina-CORS GeoRinex QC import, fictional scenario markers and synthetic data controls. Closing the lab hides them again without changing core datasets.

**Two honest outputs:**

- **Prepare verification brief** (Overview): concise, sector-specific print / Save as PDF, with the published historical measurement, unknown current condition, missing exact geometry, and explicit next evidence requests. This depends only on validated historical sector records; it does **not** need a GNSS position solution. If the published sector extract cannot load, the action stops instead of fabricating a report.
- **Print evidence dossier** (GNSS Analyst): technical report with CSEM trend, the independently sourced observation QC, provenance guard, spatial references, and all method limits. This requires a valid loaded GNSS series.

**Commercial hypothesis (unproven):** a maintenance or geodetic planning team may save coordination effort by getting a reproducible missing-evidence request. We have **not** validated time saved, willingness to pay, asset criticality, safe operational thresholds or a production buyer. This product must not be sold as continuous asset monitoring or structural risk scoring.

Feature switches are defined in [`src/feature-flags.js`](src/feature-flags.js):
- `inaCorsImport`: off by default; user-declared Ina-CORS QC import only
- `syntheticSandbox`: off by default; illustrative test fixtures and sandbox view
- `fictionalMapMarkers`: off by default; only source-backed reference points appear in the normal map

For an intentionally experimental share link, append `?lab=1`. **This is UI feature gating, not authentication or access control.** Plan B verified BAKO evidence remains available without logging in or enabling the lab. Plan A remains an offline QC import, not a live stream or BIG-verified data certificate.

## Local CSEM / CSMG multi-day RINEX observation QC

**In GNSS Analyst:** open **GNSS Observation Readiness** and click **Select QC JSON**. Choose the locally generated QC summary file (for example a baruna_private_cors_qc_*.json on your computer). The browser displays:
- side-by-side daily **CSEM / CSMG** 30-second epoch coverage and unavailable station-days;
- common complete-day count, per-station epoch totals, observed GPS/GLONASS/Galileo/SBAS pseudorange C1 presence, and interval gaps;
- scientific limitations: the chart **does not** calculate CORS displacement, annual subsidence, hazard or asset inspection priority.

**Privacy:** the input is parsed entirely in the current browser tab. It is never sent to a server, saved to localStorage or included in the public static build. Click **Clear local comparison** to remove it from the UI. Make sure applicable BIG/SRGI rights permit any distribution of resulting charts or screenshots.

The schema is validated and intentionally limited to two station identities with one calendar year, 30-second (2,880 epoch/day) RINEX2-derived summaries. Keep raw RINEX and private QC artifacts off GitHub. For the next data-collection gates (30-day monitoring, same-epoch GPS-vs-multi-GNSS positioning, long-term position solutions and surveyed infrastructure), see [CORS QC evidence & future-data decisions](docs/CORS_QC_EVIDENCE_AND_NEXT_DATA.md).

## Real Semarang basemap + offline GIS fallback

BARUNA Sentinel now opens with a **real interactive OpenStreetMap street basemap**, powered by **locally packaged Leaflet 1.9.4**. Drag/pan, zoom, scale and three selectable source-referenced points (BIG CSEM, OSM Tanjung Emas terminal and Semarang city GIS Genuk office) work in both Decision and Analyst modes. No account, paid API key, or remote JavaScript CDN is needed. Each reference marker opens the existing station/location inspector with lat/lon, source URL and approximate great-circle distance from CSEM.

**Internet requirement:** street **tiles** are retrieved from OSM only for the visible viewport. If tiles cannot load, the browser falls back to the previously available offline WGS84 coordinate plot. The user can switch manually via **Coordinate grid / Offline**. The library itself is bundled and locally licensed (Leaflet BSD-2-Clause); only online tiles require connectivity.

**OSM attribution and fair use:** the map visibly credits [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) and follows [OSM standard tile usage](https://operations.osmfoundation.org/policies/tiles/). No bulk tile downloads, prefetch, offline caching feature, or unlimited-use promise. A commercial deployment with significant traffic should use a suitable tile provider or self-hosted vector tile service.

**Scientific scope:** the three public reference points are not surveyed port asset monitoring points, and the six genuine historical infrastructure sector observations lack exact verified geometries in this MVP. We never invent surveyed sector pins, exposure rasters or hazard estimates. BAKO QC is a separate station in Cibinong and is not pinned as Semarang movement.

Node test + browser smoke check the original WGS84 fallback, real Leaflet runtime, marker layers, attribution, location inspector, field evidence and mobile accessibility. CI stubs third-party **tile images** to keep tests deterministic; that is not a claim of external tile service uptime.

## Demo (software-only)
1. Auto-load an **authentic historical CSEM GPS-derived series** from a locally bundled source-derived numeric extract (2010–2021), an explicitly illustrative fixture, or a user-supplied cleaned `.rneu` time series.
2. Validate dates, units, duplicate epochs, completeness, and observation duration.
3. Calculate a **descriptive** vertical displacement trend from parsed positions. No engineering threshold, structural failure probability, or flood prediction is implied.
4. Independently inspect a user-supplied RINEX observation file to identify declared/observed GNSS constellations when supported. A GPS-only time series is **not** evidence of multi-GNSS processing.
5. Show three **synthetic** asset scenarios with clearly labelled *illustrative scheduling tiers* derived only from synthetic exposure/criticality. Regional observations only produce `VERIFY_LOCAL_EVIDENCE`, never operational asset inspection priorities.
6. Gate evidence provenance: BAKO authentic RINEX QC does not validate a historical CSEM GPS displacement solution. Export JSON containing gate state, method, sources and limitations.

## Scientific source
Susilo et al. (2023), [Scientific Data 10, 421](https://doi.org/10.1038/s41597-023-02274-0) and [Zenodo dataset 7775016](https://doi.org/10.5281/zenodo.7775016), containing cleaned `.rneu` and GAGE `.pos` historical data (2010–2021). The paper describes processing **GPS phase observations**. Do not present this dataset as proven multi-constellation data.

## How to run
Static HTML/CSS/ES modules with one pinned map library (Leaflet); no backend, API keys or live geodetic API integration. Leaflet is installed at build time and copied into the approved static `dist/` artifact.

```bash
npm install
npm run check
python3 -m http.server 4173 --directory dist
# open http://localhost:4173
```

The source also supports static hosting on Vercel. Automated Chromium desktop/mobile and JSON export checks are provided in `.github/workflows/browser-smoke.yml`. The default bundled CSEM file contains all 3,561 numeric observation rows extracted from the public cleaned Zenodo time series; original header comments were replaced with explicit source attribution. The alternative fixture is invented for UI testing and prominently labelled **illustrative / not a real GNSS observation**. Neither stream is proof of multi-constellation observations.

## Official Ina-CORS vs fallback — two independently labelled paths

Read [the two-lane BIG data plan](docs/INACORS_DUAL_DATA_PLAN.md) before the 16 Nov submission freeze.

- **Plan A / optional local RINEX:** after receiving authorized original Ina-CORS observations, run the existing Python GeoRinex pipeline using `--file`, `--station`, `--source-url` and `--output`. In **GIS / Analyst**, import the generated QC JSON. Station identity is **user-declared, NOT independently certified by BIG**. No recent positioning/subsidence or measured structural state is inferred.
- **Plan B / already validated:** click **Restore verified BAKO fallback**. Pinned IGS BAKO multi-GNSS QC still works without any Ina-CORS account; historical CSEM and Tanjung Emas sectors remain independent reference sources.
- **No new API or backend dependency:** an unanswered access request never prevents video, presentation or offline demonstrations.

## Event readiness
- [x] Verify authentic multi-constellation RINEX via GeoRinex (BAKO IGS, independent from CSEM); Semarang-local equivalent remains future work
- [x] Bundle historically processed CSEM Semarang time series with original source citation; verify no implied multi-GNSS solution
- [x] Complete Node regression tests, static dist build and Chromium browser smoke test (including PDF)
- [ ] Record 60-second UI demonstration
- [ ] Prepare 5-minute slide deck
- [ ] Submit material to kerjasama@big.go.id by **16 Nov 2026, 23:59 WIB**
- [ ] Confirm amended team member Sulthan Bransyah with organizers

## Explicit limitations
- No raw RINEX positioning solution or RTK processing.
- A RINEX header declaring constellations is not sufficient evidence of actual observation records; the UI distinguishes the two.
- Linear slopes are descriptive estimates, not peer-reviewed geodetic solutions.
- Regional stations are not direct asset instruments.
- Exposures, assets, priorities in demonstration mode are synthetic and not operational advice.
- Neither data source should be silently merged with the other when date, frame, or station provenance differs.

## Verified real multi-GNSS observation QC (15 Nov 2026)

A GitHub Actions run successfully downloaded genuine BAKO IGS RINEX from BKG and decoded the compressed archive using **GeoRinex**:

- Evidence: https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506
- Source: `BAKO00IDN_R_20250010000_01D_30S_MO.crx.gz`, 1 January 2025, IGS station BAKO (Cibinong, Indonesia)
- Measured window: 41 observation epochs in 20 minutes
- Populated pseudorange: GPS, GLONASS, Galileo, BeiDou, QZSS, and SBAS
- Average satellites with usable pseudorange per epoch: GPS only **8.951**, all present systems **44.634**
- 41/41 epochs have observations beyond GPS
- The result is an **observational availability comparison only**, *not* an accuracy or Semarang subsidence comparison

The static UI loads the verified summary from `data/BAKO_IGS_2025-001_20min_qc_summary.json`.
The complete machine-generated QC report is available as a GitHub Actions artifact.
To reproduce processing from the original source:

```bash
python3 -m pip install georinex hatanaka
python3 scripts/verify_igs_rinex.py
```

See [the frozen Semarang use case and scientific limits](docs/USE_CASE_AND_REAL_RINEX_EVIDENCE.md).

## Competition-ready case-study improvements (15 Nov 2026)

**Run case study:** Click **Run Semarang case study** at the top to replay two separately sourced datasets: CSEM historic GPS-derived positions and BAKO archived, GeoRinex-verified multi-constellation observation QC. The evidence gate explicitly refuses to link them as a common multi-GNSS displacement solution.

**Geographic context:** A self-contained WGS84 reference-point SVG displays CSEM (coordinates transcribed from BIG's InaCORS 2018 catalogue), Tanjung Emas passenger terminal (OpenStreetMap), and Genuk district office (municipal GIS). Three amber site markers A–C are **invented scenario points**, not surveyed assets. The plotted distances describe geography only, not asset deformation. **This is not a basemap, DEMNAS raster or validated exposure layer.** The original proposal's authoritative spatial exposure-analysis capability remains outside this demo.

**Evidence dossier:** Select **Print evidence dossier / Save PDF** in the observation desk. The browser renders a print-formatted A4 report showing source, period, geospatial provenance, QC metrics, independent-source evidence gate, scientific limitations and non-operational example review tiers. **Download evidence JSON** includes the geographic context and fictional-asset flags.

**Reproducible checks:** `npm run check` tests scientific guardrails and writes a static deployment artifact; GitHub Actions also performs real-browser checks for the map, one-click demo, exported JSON, print PDF and mobile layout.

### Deploy to Vercel (manual Git import)

The project intentionally has **no backend, DB, secret or live external map tile dependency**. The top-level `vercel.json` pins:

- Framework: **Other**
- Build command: `npm run build`
- Output directory: **dist**
- Root directory: **./**

The build scripts copy only approved public assets into `dist/` (no GitHub workflows, Python GNSS tooling, unit tests or internal docs). `npm run build` is zero-dependency and safe for Node.js 20+.

Do not configure Vercel to serve `.` or bypass `dist`; the deliberate isolation is a deployment guardrail.

### Remaining before submitting

- Capture and check the 60-second walkthrough and the five-minute slides.
- Validate the manually deployed URL on the presentation laptop, including PDF print/export.
- If available, obtain genuine Semarang RINEX for the original use case; BAKO remains explicitly a separate instrument-capability proof.
- Do **not** claim this demo contains actual DEMNAS exposure analysis, physically measured asset risk, an operational GNSS positioning pipeline, or a production operator integration.

## Real port-infrastructure historical field evidence — NOT current GNSS

BARUNA Sentinel now includes a **published, real field study** about *six Tanjung Emas Harbour infrastructure sectors*. Source: Purnomo Raharjo & Mira Yosi (2017), ["The Identification of Land Subsidance by Levelling Measurement and GPR Data at Tanjung Emas Harbour, Semarang"](https://doi.org/10.32693/bomg.32.1.2017.351), reporting 2005 field levelling and a preceding 10-year historic harbour context.

| Real documented sector | Published cumulative settlement (historical) |
|---|---:|
| Coaster Street | 21–41 cm |
| Container wharf | 62–94 cm |
| North breakwater | 64–79 cm |
| West breakwater | 74–140 cm |
| East groin | 76–89 cm |
| Stacking area | 77–109 cm |

These quantities are **neither 2026 asset conditions nor annual rates**. Exact survey geometry for these sectors has *not* been established in the MVP; therefore real sectors appear in an **evidence register, without fabricated point locations**. All require fresh independent measurements and an operator-approved inspection protocol before operational ranking.

This separate real-world literature case shows why generic citywide or single-station displacement is inadequate. Historical harbour levelling, CSEM GPS time-series analysis and BAKO multi-GNSS observation QC are independent measurement datasets: the MVP does **not** merge or interpolate them.

The frontend renders a filtering, interactive *Historical Field Evidence* register and an opt-in OpenStreetMap embedded street map. The official OSM embed requires internet; the previously available source-grounded WGS84 offline point plot remains the default. OSM street context is not surveyed GNSS ground truth or an engineering inspection record.

Research extract: `data/tanjung-emas-historical-field-evidence.json`, validated by `src/historical.js` and unit tests. Printable PDF dossier and JSON export include published sectors with provenance and explicit current-data gaps.

## Executive decision desk — commercial positioning, without invented urgency

As of the competition snapshot (15 Nov 2026), the product now opens with a buyer-facing **inspection evidence readiness** panel. It distinguishes:

- **6 historically measured Tanjung Emas sectors** based on published 2005 field levelling (Raharjo & Yosi 2017); no current 2026 measurement inferred.
- **3 independent authentic evidence streams** when loaded: field-study sector ranges (2005), CSEM processed GPS historic positions (2010–2021) and BAKO original multi-GNSS observation QC (1 Jan 2025).
- **0 current on-asset measurements in this prototype**, explicitly not a count of all instruments or measurements available in the real port.

A dated BMKG coastal-flood bulletin records Semarang as included **1–6 Nov 2026**; this was a *past coastal water-level alert*, not an active alert, GNSS deformation observation, or a known structural condition.

**Decision output:** "Prepare an evidence brief" prints a sector-specific verification request for the currently selected documented sector. The request identifies missing asset boundary/criticality, up-to-date survey, reference frame/source matching and qualified expert review. It does not estimate costs, financial ROI, probability of failure or engineer-certified inspection priority.

**Commercial hypothesis, not validated result:** a maintenance/asset-integrity team may benefit from consolidating provenance and requests for necessary site verification. A paid pilot would require an operator partner, a real asset register, local surveys and agreed metrics before any savings or operational impact claim.

Test coverage: `src/readiness.test.js` and `scripts/browser-smoke.mjs`. Vercel remains the same static `dist/` package; **no backend, account, DB or live GNSS feed** has been introduced.


## P1: CSEM–CSMG observation QC → Tanjung Emas verification brief (16 November 2026)

For locally held, authorized CSEM and CSMG RINEX observations, use the read-only converter at [scripts/local_cors_qc.py](scripts/local_cors_qc.py) to generate **private JSON**, then open **Assessment → Published evidence → P1 / GNSS observation** to compare same-calendar-day epoch coverage and print the selected-sector verification brief with a private QC annex. See [the exact processing guide, data status, and limits](docs/P1_SEMARANG_CORS_TO_BRIEF.md).

This is **not** automatic subsidence monitoring, multi-GNSS position estimation, a BIG-issued result, an operational asset-risk score or proof that an individual port structure moved. Raw/private BIG archives must not be committed to GitHub or sent to the public app. The previously referenced ZIPs have not been read in this change; test fixtures are explicitly fictional.


## Real ASF HyP3 quality evidence in Semarang workspace (17 Nov 2026)

The Semarang `real-workspace.html#real-insar-qa` research panel reads original source-reviewed metadata from `data/semarang-real-hyp3-insar-qa.json`, tied to the real HyP3 job `a96410b0-1418-4e8b-a191-ab6f40e3e615` and source archive SHA-256. The 2–14 October 2026 product includes radar coherence and unwrapped phase at 80 m in EPSG:32749; the website publishes an auditable QA **summary**, not raw raster/map tiles. `src/real-hyp3-insar.test.js` guards provenance, QC denominator and unavailable deformation/risk values. The quality gate remains `modelGate.realInsar=false` pending reference and ground validation.

At the generalized BIG Tanjung Emas reference point, coherence is about 0.342 and unwrapped phase is NoData. This cannot support a 2026 asset subsidence rate or an operational risk score. `data/tanjung-emas-historical-field-evidence.json` independently contains genuine historical 1995–2005 harbour levelling ranges, not current-year rates. For modern rates, prioritize a multi-date InSAR series (e.g. COMET LiCSAR/LiCSBAS frame `076D_09725_121107`) plus reference-stable GNSS/levelling, a reviewed datum and surveyed port-asset geometry before making an asset claim.

## Subsidence Evidence Atlas — source-separated field, regional and radar data (17 Nov 2026)

Open the new [interactive Subsidence Evidence Atlas](subsidence-evidence.html) from Workspaces → Subsidence Evidence or Semarang Real Workspace. It displays genuine source-labelled 2005 Tanjung Emas cumulative settlement measurements across six sectors, a published 2015–2022 regional maximum of 100–120 mm/year in north/east Semarang/Demak (https://doi.org/10.1016/j.jag.2023.103579), and the 2–14 October 2026 ASF HyP3 QA snapshot. These sources represent **different periods and quantities**. The app does not invent coordinates, timeseries trends or asset-level risk.

The research source manifest lives at `data/semarang-published-subsidence-context.json`, with `src/subsidence-evidence.js` validating it alongside the existing historical and HyP3 QA datasets. Historical sector filter, evidence inspector and JSON export preserve scientific limitations; tests in `src/subsidence-evidence.test.js` prevent fabricated current annual rates or regional-to-port inference.

The independently published Semarang LiCSAR frame `076D_09725_121107` was used for historical 2015–2020 research (https://doi.org/10.3390/w14020201); this does **not** establish a ready-to-use raster in BARUNA. No valid public velocity GeoTIFF was imported by this change. Future port-specific mm/year require multi-temporal velocity, stable reference, atmospheric checks, local GNSS/levelling and exact surveyed asset geometry.

## Enterprise SaaS UI, evidence-gated ranking & verified Ourdo branding (18 Nov 2026)

- Entry `/` → Workspaces → Semarang Coastal → Tanjung Emas Area Explorer. Area Intelligence now has **Findings / Evidence Gate / Ranking & Compare** subtabs. Ranking URL: `/area-tanjung-emas.html?intel=ranking#intelligence`.
- `src/insight-ranking.js` accepts only real historical, HyP3 QA and readiness manifests; six historical 2005 sectors are displayed but **zero assets are ranked**. No inferred 2026 vertical rate, synthetic score or surveyed polygon. `src/insight-ranking.test.js` verifies fail-closed rules.
- For illustrative synthetic scenarios only, open `/spatial-demo.html#ranking`, explicitly labelled Scenario Lab · Simulated; this is separated from real source rankings.
- `legacy-saas-bridge.css` and uniform return links connect Advanced GIS, Evidence Lab, Subsidence Evidence and Scenario Lab to blue enterprise SaaS navigation. Scientific legend colours are intentionally not replaced.
- App header uses BARUNA Sentinel; the only Ourdo endorsement in the SaaS shell uses the **official Ourdo wordmark** at `assets/ourdo-tail-curve-wordmark.svg`. Removed fabricated-looking `≋`/`◈` brand glyphs and duplicate wordmark placements. Official favicon icon has been copied directly from `https://www.ourdo.id/ourdo-tail-curve-icon.svg` as `assets/ourdo-official-tail-icon.svg` and shipped in the static build. Keep brand assets as-is; do not generate or redesign them.
- Browser regression checks are in `scripts/saas-smoke.mjs`, and source validators in `npm run check`. Deployment is distinct: a GitHub push is **not** proof that Vercel production contains the new static assets.
