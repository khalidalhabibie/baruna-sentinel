# BARUNA Spatial — Semarang AOI + InSAR multitemporal execution handoff

**Maintained since:** 18 November 2026 (WIB)  
**Canonical location:** `khalidalhabibie/baruna-sentinel/docs/SEMARANG_INSAR_5_STAGE_EXECUTION.md`  
**Tracking:** [#40](https://github.com/khalidalhabibie/baruna-sentinel/issues/40) → [#41](https://github.com/khalidalhabibie/baruna-sentinel/issues/41) → [#42](https://github.com/khalidalhabibie/baruna-sentinel/issues/42) → [#43](https://github.com/khalidalhabibie/baruna-sentinel/issues/43) → [#44](https://github.com/khalidalhabibie/baruna-sentinel/issues/44)  
**Primary objective:** prove reproducible, quality-gated **area-level** InSAR line-of-sight (LOS) deformation screening across custom Semarang AOIs, keeping GNSS station evidence scientifically useful, without inventing asset risk rankings.  
**Operating principle:** finish one evidenced deliverable before starting the next costly processing step.

## Where we really are

| Stage | Tracking | Status as of 18 Nov 2026 | Reality / blocker |
| --- | --- | --- | --- |
| 1. User AOIs + local registry | [#40](https://github.com/khalidalhabibie/baruna-sentinel/issues/40) | **DONE** | 3 illustrative AOIs, CRUD, import/backup and localStorage, source coverage ranks, sub-workspaces; PR #39 merged to `main` |
| 2. Original HyP3 archive audit | [#41](https://github.com/khalidalhabibie/baruna-sentinel/issues/41) | **NEXT / BLOCKED on re-verifying original ZIP availability** | Historical source SHA and prior QA exist; current original ZIP location & checksum not freshly verified |
| 3. Compatible burst/SBAS network | [#42](https://github.com/khalidalhabibie/baruna-sentinel/issues/42) | **NOT DONE** | 19 scenes/48 candidate pairs are metadata-only snapshot; full burst/baseline compatibility and continuous network not proven |
| 4. MintPy LOS time series | [#43](https://github.com/khalidalhabibie/baruna-sentinel/issues/43) | **BLOCKED by stage 3 and processed stack** | One 12-day interferogram ≠ time series or annual motion |
| 5. AOI screening + GNSS validation | [#44](https://github.com/khalidalhabibie/baruna-sentinel/issues/44) | **BLOCKED by stage 4 QA** | Current AOI ranking = catalog coverage only, GNSS station ranking = historical station-only, infrastructure risk ranking = unavailable |

**Parallel work policy:** read-only metadata discovery and source audit may run alongside stage 2, but **no credit-consuming HyP3 job** and no claims of deformation on assets until all relevant gates pass. Do not create extra production features just to make a dashboard look finished.

## User/product decision (do not reopen casually)

1. **AOI is custom study polygon** for screening *kawasan*: Tanjung Emas, Terboyo and Kaligawe seeded as *illustrative envelopes*. The operator may draw/add more areas (20 max per browser), import GeoJSON EPSG:4326, and export backup. Specific piers, roads, foundations, or official owner-surveyed boundaries are **not** required to start area-level *research screening*.
2. **Hierarchy:** Semarang region → infrastructure sub-workspace → one/multiple AOIs → optional verified assets later. The cross-workspace ranking is now only a measure of **source catalog coverage**, not scientific deformation or safety.
3. **GNSS is material, but different evidence classes must remain distinct:**
   - Susilo et al. (2023), peer-reviewed GNSS Table 2, **20 stations 2010–2021**: historical vertical station velocity and publication uncertainty; GPS-derived, **not** new BARUNA 2026 Multi-GNSS positioning.
   - CSEM historical source-derived 3,561 epochs in BARUNA; 2010–2021 station context.
   - CSEM/CSMG PPP study 2021–2023 (Sitaningrum & Widjajanti 2024): separate period/method, do **not** mix numerically with Table 2.
   - BIG CSEM/CSMG 2026 RINEX QC: may assess observation availability locally; **QC is not a position solution**. Only an appropriate, temporally overlapping geodetic solution could be considered for independent validation of InSAR.
   - Nearest GNSS station shown in AOI detail = **geographic proximity only**, never transferred to an on-asset velocity.
4. **Science goal order:** source metadata → interferogram QA → multi-temporal **LOS** displacements → quality-gated AOI-level deformation screening → (later, with owners) exposure/criticality/survey geometry and any operational inspection risk ranking.
5. **Absolute guardrails:** no synthetic displacement in real-evidence UI; no `mm/year` extrapolated from a single 12-day interferogram; no vertical-motion claim from LOS without justified geometry/assumptions; no asset-risk or rob-depth conclusions from catalog/coherence/DEM alone; missing pixels become `INSUFFICIENT_EVIDENCE`, not `LOW_RISK`.

## Verified baseline evidence / authoritative repository paths

### BARUNA app — `khalidalhabibie/baruna-sentinel` (`main`)

| Path | What it proves | What it does NOT prove |
| --- | --- | --- |
| `src/aoi-registry-model.js`, `src/aoi-registry.js`, `src/aoi-infrastructure-cases.js`, `aoi-registry.html` | Browser-local custom AOI geometry CRUD & 3 source-labelled illustrative presets | Operator-owned asset boundaries or automatic measurement |
| `src/workspace-ranking-model.js`, `ranking-center.html` | Per-subworkspace/AOI source catalog availability & independent historic station ranking | Current ground motion or infrastructure risk |
| `data/gnss-published-2023-stations.geojson` | 20 historical published GNSS station rates, source DOI | Direct monitoring on ports/roads/warehouses |
| `data/semarang-real-hyp3-insar-qa.json` | Earlier authenticated genuine HyP3 2–14 Oct 2026 **single-interferogram QC** | Current original ZIP verified on disk; a validated LOS time-series |
| `docs/REAL_HYP3_INSAR_QA_NOV2026.md` | Earlier QA assumptions, pixel denominators and caveats | Same reference can be extrapolated to 2026 annual movement |
| `data/semarang-s1-insar-candidate-review.json` | A cached candidate search: 19 SLC scenes, 48 *candidate* pairs over 20 Jul–17 Nov 2026 | All pairs have compatible burst/baseline/land phase |
| `docs/CORS_QC_EVIDENCE_AND_NEXT_DATA.md` | Privacy-first handling of authorized local Ina-CORS QC | A solution of Semarang geodetic positions |

### Helper pipeline — `khalidalhabibie/sentinel-helpes` (`main`)

- [INSAR_BIG_RUNBOOK.md](https://github.com/khalidalhabibie/sentinel-helpes/blob/main/INSAR_BIG_RUNBOOK.md): safe cost/plan/status/download and BIG GIS context commands, strict explicit approval flags for HyP3 submission.
- [INSAR_DATA_COMPLETION.md](https://github.com/khalidalhabibie/sentinel-helpes/blob/main/INSAR_DATA_COMPLETION.md): burst preflight + storage conventions.
- `run.command` and `scripts/insar_burst_preflight.py`, `scripts/insar_hyp3_job.py`, `scripts/insar_baseline_review.py`.
- Local helper outputs under `.local/` **are not in GitHub**. Credentials and original geospatial rasters must not be committed to this public app.

### Already-documented exact HyP3 pair

- Job: `a96410b0-1418-4e8b-a191-ab6f40e3e615`; product ZIP `S1_162214_IW2_20261002_20261014_VV_INT80_5087.zip`.
- Previously recorded SHA256: `705b15ce1ba6586d859abe110a62423fd20241dfcb00947dfc5af223eb4b2a2b`. **The value is a prior manifest, not evidence of a fresh file check.**
- Acquisition: 2026-10-02 → 2026-10-14; Sentinel-1 VV descending; full burst `076_162214_IW2`; 80m raster in EPSG:32749; Copernicus GLO-30 source DEM, **not BIG DEMNAS**.
- QA: 15,105 / 16,542 land raster centers with valid phase and coherence passed the earlier ≥0.7 research screening criterion (91.31% of that *subset*, not of total AOI). At BIG RBI Tanjung Emas point: coherence ≈0.342; phase NoData; 500m radius: 0/122 qualified; 1km radius: 3/489. The port point is cartographic, **not surveyed asset**.
- Those thresholds and QA metrics are *research diagnostics*, not a geodetic accuracy certificate; port/coastal masked conditions make this use case hard.

## Execute next — stage 2 (#41) ONLY

**Outcome:** Either (a) original ZIP re-verified and locally inventoried, or (b) documented access blocker with legitimate recovery path. No need to redownload data blindly.

Run on the machine that holds the source archive (Mac command examples):

```bash
cd /Users/macpro/Code/bhimerka/sentinel-helpes
git pull origin main
bash run.command --insar-job status
# Search for the already-downloaded filename in your own authorized project/download folder.
find .local/insar ~/Downloads -name 'S1_162214_IW2_20261002_20261014_VV_INT80_5087.zip' -type f 2>/dev/null
# Only after you have the exact filepath, check its byte-level integrity.
shasum -a 256 "/absolute/path/to/S1_162214_IW2_20261002_20261014_VV_INT80_5087.zip"
unzip -l "/absolute/path/to/S1_162214_IW2_20261002_20261014_VV_INT80_5087.zip" | head -80
```

Expected manifest SHA must match the archived value above; if mismatched **do not trust** file without investigation. Do not send Earthdata tokens, `.env`, RINEX archives, or private source assets in GitHub issues. If file is absent, consult job receipt and official HyP3 retention/availability; a different pair must be treated as a **new product** with separate provenance.

**Definition of done / acceptance criteria** are on [#41](https://github.com/khalidalhabibie/baruna-sentinel/issues/41). Start #42 once at least the original-data state is known and the next candidate preflight has been reviewed; only then decide whether to spend HyP3 quota on additional jobs.

### Stage 3 — read-only preflight (no HyP3 credits)

```bash
cd /Users/macpro/Code/bhimerka/sentinel-helpes
bash run.command --insar-burst-preflight
open .local/insar/burst-preflight
```

`.local/insar/burst-preflight/BARUNA_S1_BURST_PREFLIGHT.json` is candidate metadata, **not** validated displacement. Compare full burst IDs, dates, polarization, direction, overlap/baselines, network and land coverage. For cost or submission, see the helper runbook and obtain explicit per-job operator approval. Do not automatically submit jobs.

### Stage 4 — MintPy / scientific pipeline

Follow ASF's official workflow:
- HyP3 Burst InSAR Product Guide: https://hyp3-docs.asf.alaska.edu/guides/burst_insar_product_guide/
- ASF OpenSARLab MintPy Recipe Book: https://github.com/ASFOpenSARlab/opensarlab_MintPy_Recipe_Book
- MintPy reference: https://mintpy.readthedocs.io/en/latest/

Require a compatible stack of *unwrapped and georeferenced interferograms*, aligned to one reference, masked and independently QA'd. Review atmosphere/ramp, temporal coherence, unwrapping artifacts, network connectivity, error and sign. Output **LOS** time series before proposing annual/vertical estimates.

### Stage 5 — area screening and publication gates

For each AOI:
1. Explicit area polygon provenance, georeferencing, matching raster grid and time period.
2. Intersection with **valid land pixels**, measured coverage denominator, NoData fraction, pixel-level reliability.
3. LOS motion summary (e.g., robust statistics) only after scientifically valid stack; disclose time window/reference/uncertainty, do **not** cherry-pick valid pixels or hide missing sectors.
4. Source-separable GNSS context, with independent co-temporal GNSS/levelling only if a validated position series actually exists.
5. **Deformation Screening ranking** only among comparable, accepted AOIs; fail any criterion → `INSUFFICIENT_EVIDENCE`; **asset-risk ranking** remains blocked without verified owner asset inventory/exposure/criticality/reviewed policy.

## Task lifecycle / how to keep context across chats

1. **Always read this file first** and inspect linked GitHub issues before implementation. Existing static docs may lag code; compare `main` and source manifests for current truth.
2. Work on **one currently unblocked issue at a time**, commit with `Refs #NN`, and run exact focused tests and build. Keep raw source data private; publication manifests only.
3. When work ends: update the ticket with (a) code/command executed; (b) evidence output and checksum; (c) PASS/BLOCKED state; (d) known limitations; (e) next action. Update the stage table in **this document**. Do not mark `DONE` for a plan alone or a successful metadata search.
4. Do not count the three AOI presets as three independently validated measured assets. Do not count a historical GNSS station ranking as a 2026 Multi-GNSS position solution. Do not hide source period differences.
5. Do not claim deployment succeeded unless `main` commit AND deployed URL/build were checked separately. Targeted QA may pass while unrelated legacy CI tests remain failing.

### Copy/paste continuation prompt (fresh ChatGPT session)

> Continue BARUNA Spatial Semarang InSAR program using `khalidalhabibie/baruna-sentinel/docs/SEMARANG_INSAR_5_STAGE_EXECUTION.md`. Read linked GitHub issues #40–#44 and helper `sentinel-helpes`. One issue at a time, start with highest-priority unblocked issue (#41 at initialization). Check current source files and evidence, don't reimplement completed AOI registry or misrepresent GNSS station observations as asset measurements. Report PASS/BLOCKED, changes, missing input and next concrete action. No unauthorized HyP3 credit-spending or posting raw BIG data.

## Source citations

- Susilo et al. (2023): https://doi.org/10.1038/s41597-023-02274-0 ; station data: https://doi.org/10.5281/zenodo.7775016
- Sitaningrum & Widjajanti (2024): https://doi.org/10.22146/jgise.95957
- ASF HyP3 Burst InSAR docs: https://hyp3-docs.asf.alaska.edu/guides/burst_insar_product_guide/
- MintPy official docs: https://mintpy.readthedocs.io/en/latest/
