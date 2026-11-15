# BARUNA Sentinel — BIG Bhumireka 2026

Independent, offline-capable competition prototype. This repository does **not** import or depend on the existing BARUNA WebGIS application.

## Problem
Coastal infrastructure teams need an explainable **inspection-review queue**, not a misleading map implying that a nearby GNSS station measures every asset.

## Competition UI: simple by default

**Decision view (default)** answers three questions: what historical evidence exists, which sector is selected, and what new measurements should be requested. The interactive map shows public reference locations; technical details and source caveats are available on demand.

**GIS / Analyst** retains the original GPS/GNSS analysis, spatial audit, source controls and export. Use **Enable experimental tools** to reveal local Ina-CORS GeoRinex QC import, fictional scenario markers and synthetic data controls. Closing the lab hides them again without changing core datasets.

Feature switches are defined in [`src/feature-flags.js`](src/feature-flags.js):
- `inaCorsImport`: off by default; user-declared Ina-CORS QC import only
- `syntheticSandbox`: off by default; illustrative test fixtures and sandbox view
- `fictionalMapMarkers`: off by default; only source-backed reference points appear in the normal map

For an intentionally experimental share link, append `?lab=1`. **This is UI feature gating, not authentication or access control.** Plan B verified BAKO evidence remains available without logging in or enabling the lab. Plan A remains an offline QC import, not a live stream or BIG-verified data certificate.

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
Pure HTML/CSS/ES modules; no third-party frontend dependencies and no API calls.

```bash
python3 -m http.server 4173
# open http://localhost:4173
node --test
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
