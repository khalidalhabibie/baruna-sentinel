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
| 2. Original HyP3 archive audit | [#41](https://github.com/khalidalhabibie/baruna-sentinel/issues/41) | **AUDIT TOOL DONE / ORIGINAL ZIP BLOCKED** | New read-only local audit CLI merged in helper [PR #16](https://github.com/khalidalhabibie/sentinel-helpes/pull/16). 9/9 offline synthetic tests passed locally; original ZIP is not available in this ChatGPT execution environment, so fresh original checksum/raster QA remain pending. Helper Actions runner starts zero steps (including pre-existing main workflows); remote CI is NOT green. |
| 3. Compatible burst/SBAS network | [#42](https://github.com/khalidalhabibie/baruna-sentinel/issues/42) | **PUBLIC ASF BURST PREFLIGHT DONE / BASELINE PENDING** | Direct ASF metadata query (18 Nov 2026) returned 9 descending VV acquisitions with shared Full Burst ID, 8 chronological candidate pairs, 25 pairs within 48 days, and 9/9 centerpoint footprint coverage for 3 illustrative AOIs. Perpendicular baselines, full polygon / quality masks, processing and time series NOT validated. [Source snapshot](https://github.com/khalidalhabibie/sentinel-helpes/blob/main/research/insar/semarang_asf_public_burst_candidates_20261118.json). |
| 4. MintPy LOS time series | [#43](https://github.com/khalidalhabibie/baruna-sentinel/issues/43) | **BLOCKED by stage 3 and processed stack** | One 12-day interferogram ≠ time series or annual motion |
| 5. AOI screening + GNSS validation | [#44](https://github.com/khalidalhabibie/baruna-sentinel/issues/44) | **BLOCKED by stage 4 QA** | Current AOI ranking = catalog coverage only, GNSS station ranking = historical station-only, infrastructure risk ranking = unavailable |

**Parallel work policy:** read-only metadata discovery and source audit may run alongside stage 2, but **no credit-consuming HyP3 job** and no claims of deformation on assets until all relevant gates pass. Do not create extra production features just to make a dashboard look finished.

**Remote-only execution note (18 Nov):** The user does not currently have their Mac. BARUNA can still perform public ASF catalog verification, write and review GitHub source snapshots, prepare minimal processing networks, and audit research provenance via connected tools; it **cannot** attest to locally stored original ZIP bytes, inspect raw raster pixels, run long MintPy jobs on unavailable scientific compute or access HyP3 account-only download URLs without valid account access. Do not ask the user to run laptop commands now; stage #41 stays blocked on source access while public metadata #42 can progress safely.

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

## Product readiness update — 18 Nov 2026 (pre-data work)

**Completed:** [PR #45](https://github.com/khalidalhabibie/baruna-sentinel/pull/45) merged into `main` (`4755c4f396a10b260ca087de29ada6cadaf736e3`). The live `ranking-center.html` implementation now includes section **04 / Real Sentinel-1 Source Readiness**, sourced from the public [ASF 18 Nov preflight JSON](../data/semarang-asf-burst-network-20261118.json) and previously archived [HyP3 QA manifest](../data/semarang-real-hyp3-insar-qa.json). The public site itself is **not confirmed deployed** by this GitHub merge.

- Shows **9 exact acquisition burst dates / 8 adjacent temporal candidate pairs**, **3 illustrative AOI polygon centers inside the retrieved footprint polygons**, and **one historical QA summary** for 2–14 Oct 2026; the original HyP3 ZIP remains unreverified.
- Highlights **Tanjung Emas coherence approximately 0.342, unwrapped phase NoData at the cartographic locator and 0/122 candidates within 500 m passing prior research QC**.
- Keeps **validated multitemporal LOS time series, 2026 GNSS validation, annual vertical rate, deformation risk ranking all blocked** until genuine processing/QA. It does not claim full AOI footprint pixel coherence.
- Strict validator in `src/insar-network-readiness.js` cross-checks exact sourced dates, burst IDs, adjacent edges, provenance, prior HyP3 job identity and NO-GO science gates. A broken/missing source displays SOURCE UNAVAILABLE rather than fabricated metrics.
- **QA:** dedicated [run 44235774968](https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/44235774968) **SUCCESS**, source tests, existing AOI/GNSS gates, static build, desktop/mobile browser smoke all passed. Legacy global MVP checks have their own previous failures; do not conflate them with this focused QA.
- Operationally, when the source ZIP becomes accessible, first use `sentinel-helpes` `bash run.command --insar-archive-audit --raster-qa` and attach the sanitized report to issue #41. Do **not** treat the eight catalog links as processed interferograms. Review perpendicular baseline and choose a small authorized stack in issue #42 before issuing additional HyP3 orders.

**Time expectations:** original ZIP checksum/inventory is a lightweight local audit, but waiting for new HyP3 products, stacking multiple interferograms, MintPy geodetic/atmosphere/mask QA and independent GNSS processing may be substantial or require revisiting bad coastal coherence. Never promise the entire time series can be validated in one evening.

## Public ASF preflight completed without user's laptop (18 Nov 2026)

Read-only catalog request (HTTP 200) using dataset `SLC-BURST`, point [110.420, -6.945] and window **20 Jul–17 Nov 2026** returned **40 public feature records**. Source filtering by actual `burst.fullBurstID=076_162214_IW2`, `VV`, `DESCENDING` and `SENTINEL-1D` yielded **9 acquisitions**: 22 Jul, 3/15/27 Aug, 8/20 Sep, 2/14 Oct and 7 Nov. All are candidate-compatible by **shared Full Burst ID**, not validated perpendicular baseline.

- **Eight adjacent temporal links:** 7 × 12-day plus 1 × 24-day, creating a chronologically connected **candidate** network.
- **Twenty-five** total temporal candidate pairs at separation <=48 days among these 9 acquisitions; do not process them all blindly.
- **3/3 illustrative AOI centers are inside all nine returned ASF burst footprint polygons** using point-in-polygon. This is not proof of full AOI coverage or usable coherent land pixels; prior HyP3 data reported Tanjung Emas point coherence 0.342 and phase NoData.
- Previously processed 2–14 Oct pair falls within this network, but its original ZIP cannot currently be reverified from accessible files.
- Public source snapshot: [Semarang verified catalog preflight](https://github.com/khalidalhabibie/sentinel-helpes/blob/main/research/insar/semarang_asf_public_burst_candidates_20261118.json); ticket [#42](https://github.com/khalidalhabibie/baruna-sentinel/issues/42) includes all burst names and explicit scientific no-go gates.

**What can now advance without a laptop:** select minimal candidate edges and read-only orbital/perpendicular baseline review, source availability and parameter documentation. **What remains blocked:** verifying the operator's HyP3 ZIP, additional paid HyP3 burst processing, geodetic time-series and risk claims. Do not invent a 2026 deformation/annual mm-year estimate.

## Execute next — stage 2 (#41) ONLY

**Outcome:** Either (a) original ZIP re-verified and locally inventoried, or (b) documented access blocker with legitimate recovery path. No need to redownload data blindly.

Read-only archive auditor is now implemented in `sentinel-helpes` `main` as `bash run.command --insar-archive-audit`. **Do not redownload or submit another job before checking your existing archive.** The auditor never reads an Earthdata token or spends HyP3 credits.

Run on the Mac containing your project and ZIP:

```bash
cd /Users/macpro/Code/bhimerka/sentinel-helpes
git pull origin main

# Check exact known ZIP in .local/insar/hyp3/products or ~/Downloads.
bash run.command --insar-archive-audit

# If ZIP exists elsewhere, supply its full path:
bash run.command --insar-archive-audit \
  --archive "/your/local/path/S1_162214_IW2_20261002_20261014_VV_INT80_5087.zip"

# Optionally audit EPSG:32749, 80 m, and common GeoTIFF grid.
# Requires rasterio in the helper's Python venv.
bash run.command --insar-archive-audit --raster-qa
```

Output: private `.local/insar/hyp3/source-audit.json` with `PASS_ARCHIVE_INTEGRITY_ONLY`, `PASS_ARCHIVE_INTEGRITY_AND_RASTER_METADATA`, `BLOCKED_SOURCE_UNAVAILABLE`, `BLOCKED_SOURCE_VERIFICATION`, or `BLOCKED_RASTER_METADATA`. A PASS proves ZIP/file integrity and (if requested) raster *metadata*, **not** validated scientific displacement. If missing, consult the existing ASF job in Vertex; previous attempts at `--insar-job download` returned generic `ValueError`, so troubleshoot the authenticated file manifest without bypassing URL host safety checks or exposing signed URLs/tokens. See [full recovery guide](https://github.com/khalidalhabibie/sentinel-helpes/blob/main/docs/HYP3_ORIGINAL_ARCHIVE_AUDIT.md).

**Verified activity on 18 November 2026:** ChatGPT runtime looked for the exact ZIP in current available files; only an unrelated GNSS toolkit was accessible. Local audit of a missing target returned exit code 2 / `BLOCKED_SOURCE_UNAVAILABLE`. This is **not proof the user's Mac or ASF no longer has the ZIP**. Synthetic 9/9 test suite passed in the local execution container; helper GitHub Actions could not run any steps on both baseline and new workflows. The original ZIP has not been freshly checked.

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
