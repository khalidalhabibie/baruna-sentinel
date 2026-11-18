# BARUNA — single-pair InSAR spatial phase continuity QA

**Evidence date:** 18 November 2026 (WIB). **Source:** operator-uploaded genuine ASF HyP3 Sentinel-1D VV descending geocoded GeoTIFFs, reference 2 Oct 2026 and secondary 14 Oct 2026, Full Burst ID `076_162214_IW2`, EPSG:32749, nominal 80m pixel spacing. The original ZIP integrity/metadata audit was already completed under [issue #41](https://github.com/khalidalhabibie/baruna-sentinel/issues/41).

**Goal:** extract an additional **spatial continuity diagnostic** from the *already available 12-day interferogram*, before ordering more paid interferograms. This is not a movement/risk estimate.

## Results (real source raster pixels)

| Illustrative AOI | Eligible land pixel centers, coherence>=0.7 | Eligible SNAPHU component | Eligible 4-neighbor phase edges | Abs delta unwrapped phase p95 (radians) | Edges with abs delta >π |
|---|---:|---|---:|---:|---:|
| Tanjung Emas | 74 / 149 | ID 1 | 93 | 0.4549 | 0 |
| Terboyo | 99 / 190 | ID 1 | 138 | 0.6816 | 0 |
| **Kaligawe** | **173 / 178** | **ID 1** | **313** | **0.4145** | **0** |

Eligible pixels = land mask valid and 1, coherence and unwrapped phase valid, SNAPHU component >0, and coherence>=0.7. The 4-neighbor edges compare only two adjoining eligible 80m pixel centers **within the same component ID**. The edge difference is an **absolute raw radian phase difference**, not geodetic displacement, nor LOS change. The >π check is only a heuristic to flag abrupt local discontinuities.

The single component-ID output across eligible samples **does not** imply that all qualified pixels form one continuous spatial cluster: the earlier 8-neighbor quality-mask analysis found **four clusters at Tanjung Emas, two at Terboyo, one at Kaligawe**. These are different concepts.

**Interpretation:** These local diagnostics reinforce using *Kaligawe for the first continued pixel-quality experiment*, but a smooth unwrapped phase field can still contain coherent biases, wrong reference, atmospheric artifacts or phase unwrapping errors. A zero count of >π edges **does not validate unwrapping** and must not be used to infer vertical subsidence. The source ZIP products have no independently confirmed stable geodetic reference or atmospheric correction.

## Reproducible method

The read-only script [`scripts/insar_phase_continuity_qa.py`](../scripts/insar_phase_continuity_qa.py) loads four original **geocoded** rasters: `_corr.tif`, `_unw_phase.tif`, `_conncomp.tif`, `_water_mask.tif`. It verifies exact EPSG, nominal 80m resolution, grid alignment and expected 541x1312 dimensions, and records SHA256 for the four source TIFFs without committing them. The three illustrative WGS84 AOI polygons come from [`src/aoi-infrastructure-cases.js`](../src/aoi-infrastructure-cases.js).

Run from the repository (with Python `numpy`, `scipy` and `rasterio` available):

```bash
python3 scripts/insar_phase_continuity_qa.py \
  --input-dir /path/to/PRIVATE-HYP3-extracted \
  --out /tmp/semarang-phase-qc.json
```

Compare its output with the sanitized committed [data JSON](../data/semarang-hyp3-phase-continuity-qa-20261118.json). Raw GeoTIFFs and user/account credentials stay **private**. The 18 Nov 2026 source extraction locally produced the same report byte-for-byte twice; the GitHub report is the sanitized numeric record. This report extends, and must not be confused with, the earlier [AOI coherence pixel QA](./SEMARANG_HYP3_REAL_AOI_PIXEL_QA_20261118.md).

## Do not confuse scientific stages

- **Available now:** one genuine 12-day interferogram, source hash/inventory checks, 3-AOI coherence/continuity diagnostics and ASF public metadata/baseline network.
- **Still blocked:** two additional source products for a proposed 3-date Kaligawe phase-closure experiment, their per-pair raster QA, explicit HyP3 credit approval, multitemporal MintPy processing, stable reference/atmosphere correction and independent GNSS comparison.
- **Not permitted:** mm/year from this single pair; true vertical subsidence without justified LOS projection/model; asset-risk ranking or safety claims based on these diagnostics.

Deferred operational blocker and approval gate in [Trello BARUNA](https://trello.com/c/7bd5dPUP). Science work tracked in [GitHub #42](https://github.com/khalidalhabibie/baruna-sentinel/issues/42) → [#43](https://github.com/khalidalhabibie/baruna-sentinel/issues/43). No new HyP3 jobs or credits were used.
