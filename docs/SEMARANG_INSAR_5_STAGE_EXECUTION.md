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
| 2. Original HyP3 archive audit | [#41](https://github.com/khalidalhabibie/baruna-sentinel/issues/41) | **DONE — VERIFIED ARCHIVE INTEGRITY AND RASTER METADATA** | 18 Nov operator Mac reran updated helper: **18/18 local tests PASS**, exact source SHA-256 and ZIP CRC PASS; 15 original members inventoried and safely extracted privately; README underscore variant accepted. Final **`PASS_ARCHIVE_INTEGRITY_AND_RASTER_METADATA`** verifies mandatory raster CRS/grid metadata only. Scientific pixel/coherence QA and multitemporal deformation remain outstanding under #42/#43. |
| 3. Compatible burst/SBAS network | [#42](https://github.com/khalidalhabibie/baruna-sentinel/issues/42) | **PUBLIC PRESELECTION + ONE BASELINE CONFIRMED / NETWORK & QA PENDING** | Live ASF provided 9 descending VV source acquisitions and 8 temporal candidate edges. The specific **2–14 October 2026** pair has ASF `asf_search` reference-based **temporal baseline 12 days and perpendicular baseline −16 m** (source check [run 44237864318](https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/44237864318), [PR #46 merged](https://github.com/khalidalhabibie/baruna-sentinel/pull/46)). Other pair baselines, full AOI coherent coverage, products, reference, and processing network **remain unvalidated**. |
| 4. MintPy LOS time series | [#43](https://github.com/khalidalhabibie/baruna-sentinel/issues/43) | **BLOCKED by stage 3 and processed stack** | One 12-day interferogram ≠ time series or annual motion |
| 5. AOI screening + GNSS validation | [#44](https://github.com/khalidalhabibie/baruna-sentinel/issues/44) | **BLOCKED by stage 4 QA** | Current AOI ranking = catalog coverage only, GNSS station ranking = historical station-only, infrastructure risk ranking = unavailable |

**Parallel work policy:** read-only metadata discovery and source audit may run alongside stage 2, but **no credit-consuming HyP3 job** and no claims of deformation on assets until all relevant gates pass. Do not create extra production features just to make a dashboard look finished.

**Historical remote-only note (earlier 18 Nov, superseded):** Work originally proceeded while the user was away from their Mac. Later the same day, the operator executed the original ZIP archive and raster-metadata QA successfully on their Mac. Stage #41 is now complete for byte integrity and raster georeferencing only; original bytes remain private on the operator device. Public metadata planning for #42 may continue, but geodetic pixel/LOS QA is not yet complete.

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
- Expected SHA256: `705b15ce1ba6586d859abe110a62423fd20241dfcb00947dfc5af223eb4b2a2b`; **fresh operator Mac audit 18 Nov 2026 confirmed matching SHA and ZIP CRC**, followed by passing raster metadata QA. The private report is `.local/insar/hyp3/source-audit.json` (not available in the remote assistant runtime).
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

## Stage #41 completed — verified archive integrity and raster georeferencing (18 Nov 2026)

Operator reran the merged source-variant validator on the original Mac source: **18/18 offline safety tests PASS**; initial source-only audit `PASS_ARCHIVE_INTEGRITY_ONLY` and final `PASS_ARCHIVE_INTEGRITY_AND_RASTER_METADATA`. The original product SHA-256 and all member CRCs match, **15/15 archive members** are inventoried and safely extracted in ignored private storage, all mandatory scientific members are present, the README uses the authentic source `_README.md.txt` spelling, and mandatory GeoTIFF **EPSG:32749 / ~80 m raster grid CRS/alignment** passed the helper's metadata checks. No new SAR data or HyP3 credits used.

**Scope:** this proves archived source bytes and geospatial headers, **NOT** scientifically validated LOS displacement, resolved stable reference or port-area coherence. Previous Tanjung Emas port locator still had coherence ~0.342, phase NoData and 0 qualifying pixels within 500 m. The operator's source-audit report remains on their Mac; the success is evidenced here by the pasted local CLI output, not a remote reading of their ZIP.

**Next:** issue #42 selects and validates a small compatible connected burst network and actual coherent-land coverage; #43 MintPy and geodetic QA follows processed multiple pairs. Do not submit new HyP3 jobs without cost/credit consent.

## User ZIP SHA/CRC confirmed, 15 raw files extracted; README variant fix (18 Nov 2026)

The operator sent the full archive inventory: **15 member files**, `SHA MATCH: True`, `ZIP CRC VERIFIED: True`, and `EXTRACTED_SOURCE_FILES_WITH_UNRESOLVED_REQUIRED_SUFFIXES`. The sole missing *expected naming convention* was `.README.md.txt`; the real source file is `_README.md.txt`. ASF's Burst InSAR product guide specifies the dotted convention, but this pinned, source-hash-verified archive uses underscore. All required scientific raster files and the standard `PRODUCT.txt` pair metadata were listed.

[Helper PR #19](https://github.com/khalidalhabibie/sentinel-helpes/pull/19) landed a narrow acceptance of the exact observed `_README.md.txt` variant as well as documented `.README.md.txt`, with ambiguity rejection, tests reflecting the original **15-file nested archive** and no changes to source SHA/CRC, raster requirements, or science gates.

**Important: user already extracted ZIP. Do NOT rerun `--extract-safe`** (it correctly rejects overwriting destination). Next local commands:

```bash
cd /Users/macpro/Code/bhimerka/sentinel-helpes
git pull --ff-only origin main
python3 -m unittest discover -s tests -p 'test_insar_archive_audit.py' -v
bash run.command --insar-archive-audit
bash run.command --insar-archive-audit --raster-qa
```

If rasterio is missing, install to helper venv with `.venv/bin/python3 -m pip install 'rasterio>=1.3.9,<2'` and retry only `--raster-qa`. The full archive QC cannot be marked passed until actual source has been re-audited with the updated code. CRS/alignment checks and coastal QA remain separate from archive integrity; do not assert new ground deformation.

## One-paste Mac audit and local extraction (18 Nov 2026)

Helper [PR #18](https://github.com/khalidalhabibie/sentinel-helpes/pull/18) merged `--extract-safe` to main. When user has Mac, execute one combined block with local unit safety tests **before** extraction:

```bash
cd /Users/macpro/Code/bhimerka/sentinel-helpes &&
git pull --ff-only origin main &&
python3 -m unittest discover -s tests -p 'test_insar_archive_audit.py' -v &&
bash run.command --insar-archive-audit --extract-safe
```

The command hashes the original ZIP against the recorded QA digest, verifies CRC, prints all member filenames, prints missing ASF suffixes and **extracts into** `.local/insar/hyp3/extracted/S1_162214_IW2_20261002_20261014_VV_INT80_5087/` if both SHA and CRC pass. ZIP remains unchanged; destination is Git-ignored, staged with no overwrites, traversal/symlink/zip bomb guards and bounded disk usage. Missing required filenames keep `BLOCKED_SOURCE_VERIFICATION` and exit 2 even if extraction succeeds: **do not mistake extraction for full scientific QA**. Next: inspect user-provided missing suffix/name output; only then reconcile source filenames and check raster georeferencing. No new HyP3 job or credits.

## Operator ZIP audit result — original ZIP exists, required filename mismatch (18 Nov 2026)

The operator ran `bash run.command --insar-archive-audit` on their Mac and obtained `BLOCKED_SOURCE_VERIFICATION / REQUIRED_HYP3_FILES_MISSING`. **This is not a missing ZIP:** source file was found. In the original audit implementation, `SHA256_MISMATCH_WITH_PRIOR_QA` would have blocked before the archive inventory and ZIP CRC tests; therefore reaching this later error establishes that SHA-256 compared equal to recorded QA value and `ZipFile.testzip()` found no corrupt members, **assuming the script was unmodified**.

**Tooling defect identified and fixed:** the first audit CLI mistakenly printed `integrityVerified` under label `SHA MATCH`, so it displayed `False` even when SHA matched but a required member was absent. [Helper PR #17](https://github.com/khalidalhabibie/sentinel-helpes/pull/17) merged to main, with independent `sha256Verified`, `zipCrcVerified`, `productCompletenessVerified` and explicit `missingRequiredSuffixes`. Do not modify original ZIP or loosen the official ASF raster/metadata requirements to force PASS. The actual missing suffix names and archive member layout have not been sent by operator yet.

**Next operator action:** `git pull --ff-only origin main && bash run.command --insar-archive-audit`; report the printed `MISSING REQUIRED SUFFIXES` plus filename list in private `.local/insar/hyp3/source-audit.json`, then patch only verified path/name handling if necessary. Proceed with `--raster-qa` only once source completeness is understood. New HyP3 download/submission unnecessary at this stage. No new job/credits involved.

## Read-only ASF perpendicular baseline result (18 Nov 2026)

**Verified public metadata:** [PR #46](https://github.com/khalidalhabibie/baruna-sentinel/pull/46) merged to `main`; source-only [GitHub Actions run 44237864318](https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/44237864318) used the official `asf_search` product stack for reference `S1_162214_IW2_20261002T221703_VV_F470-BURST` and secondary `S1_162214_IW2_20261014T221703_VV_21AC-BURST`. The source returned **12 days** temporal baseline and **−16 meters** perpendicular baseline, with both scene IDs in the public metadata and the secondary found in the source stack. No account credentials, raster pixels, or HyP3 credit were needed.

This removes **numeric perpendicular baseline unknown for the original 2–14 Oct candidate pair only**. It does **not** verify phase coherence, unwrapping, stable reference, full AOI land coverage, processing of additional links, LOS displacement, GNSS comparability, or asset risk. The `scientificGates.baselineScientificallyAccepted` remains `false` until methodology review. Do not infer other eight-edge network baselines from one number; choose and verify each actual processing pair. Original HyP3 archive #41 remains unavailable in accessible environment.

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
