# BARUNA — Semarang InSAR connected-plus-redundant network preflight

**Evidence date:** 18 November 2026. **Scope:** actual NASA ASF SLC-BURST **source metadata**, not raw SAR pixel processing. Full Burst `076_162214_IW2`, Sentinel-1D descending VV, 9 acquisitions between 22 July and 7 November 2026.

## Results from source-derived baseline checks

The existing [8-edge chronological source scan](https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/44246881755) returned **8/8** numeric baseline pairs. An additional [7-edge skip-one scan](https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/44247545559) returned **7/7** alternative numeric baselines.

See all 15 signed provider baseline values: [`data/semarang-asf-15-baseline-candidates-20261118.json`](../data/semarang-asf-15-baseline-candidates-20261118.json).

**Critical network distinction:** the eight consecutive edges produce a connected temporal *tree*. A tree has **no independent loops**, so it cannot by itself support robust triangle phase-closure cross-checking of unwrapping errors. Seven additional skip-one edges would create source-metadata triangles *if actually processed*, but ordering all fifteen before validating pixels would be inefficient and may waste HyP3 credits.

## Recommended minimum viable scientific trial: Kaligawe

Use the existing source-backed [3-AOI October 2–14 raster QA](./SEMARANG_HYP3_REAL_AOI_PIXEL_QA_20261118.md). Kaligawe is the most suitable of **three illustrative polygons** for further processing because `173/178` land pixel centers meet an **analyst-selected coherence≥0.7 quality screen**. This is *data suitability*, not a subsidence/risk rank.

| Dates | Temporal baseline | ASF perpendicular baseline | Real HyP3 product |
| --- | ---: | ---: | --- |
| **20 Sep → 2 Oct 2026** | 12 days | −37 m | **Not processed** — possible new job 1 |
| **2 Oct → 14 Oct 2026** | 12 days | −16 m | **Existing verified HyP3 original** |
| **20 Sep → 14 Oct 2026** | 24 days | −54 m | **Not processed** — possible new job 2 |

One loop (three unique dates / three interferogram edges) can support a **first closure-consistency diagnostic**, if both missing products are processed with matching geometry and scientifically usable coherence. This is **not** enough for robust annual land-subsidence rates. Later, extend to more epochs and redundant loops, include atmospheric/ramp/reference corrections, and check against independent current Multi-GNSS/levelling when available.

## Gates before requesting new HyP3 jobs

1. Verify the existing 2–14 October package was archived and its source pixel QA known. **DONE** (#41, real source file inspection).
2. Verify all chosen burst IDs, dates and source perpendicular baseline values from ASF. **DONE for candidate three-edge triangle as metadata**.
3. Review the exact proposed job options so additional pairs use compatible 80 m resolution, VV, geometry, water mask, orbit method, DEM, reference and consistent output products. **NOT YET DONE**.
4. Run **read-only cost/quota checks** in the operator Earthdata/HyP3 account and record actual credit requirement. **PENDING**; JSON intentionally has `costEstimateCredits:null`. Do not invent prices.
5. Get **specific explicit user approval** for the two proposed jobs; only then submit (prefer sequentially with QA after the first). **NO APPROVAL OR NEW SUBMISSION**.
6. Test the resulting Kaligawe coherence/phase-mask coverage **per new pair** and inspect closure residual, connected components and spatial reference before MintPy. **PENDING**.

Additional warnings: one source product parameter file says `Baseline: +16.7183976478018` whereas ASF's relative reference stack reports `−16 m`; they use different context/reference/sign and must not be silently substituted. The original HyP3 README states no atmospheric correction and unwrapped phase references an internal SNAPHU point. Source baseline and high coherence do not validate motion or hydrogeologic causation.

**Outcome now:** ASF numeric baseline research is complete for fifteen candidate metadata edges, while geodetic SBAS processing and risk/annual-rate outputs remain **blocked** until product, reference, and science QA. No new processing credits used.
