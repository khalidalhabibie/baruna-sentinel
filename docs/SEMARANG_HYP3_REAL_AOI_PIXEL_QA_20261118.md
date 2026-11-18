# BARUNA Spatial — real HyP3 pixel QA for three Semarang AOIs

**Date:** 18 November 2026  
**Source:** operator-uploaded individual GeoTIFFs and metadata from the original single-pair ASF DAAC HyP3 product `S1_162214_IW2_20261002_20261014_VV_INT80_5087`. This is **data analysis, not simulated values**. Product metadata: Sentinel-1D descending VV; full burst `076_162214_IW2`, 2 → 14 October 2026, pixel spacing 80 m, Copernicus GLO-30 DEM, HyP3 `hyp3_isce2 3.0.2` / `ISCE2 2.6.5`. The original archive SHA and GeoTIFF grid/CRS integrity were verified earlier on the operator's Mac as documented in #41; the analyst directly opened separately uploaded rasters here. ZIP bytes were not rehashed in this execution environment.

## Real pixel-screening outcome

| Illustrative AOI | All pixel centers | Water mask 0 | Land pixel centers | Joint-valid phase + coherence + component | Meets coherence ≥0.7 | Share of land | 8-connected eligible clusters | Largest eligible cluster | Coherence ≥0.9 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Tanjung Emas | 306 | 157 | 149 | 143 | **74** | **49.66%** | 4 | 54 | 16 |
| Terboyo industrial | 240 | 50 | 190 | 187 | **99** | **52.11%** | 2 | 89 | 36 |
| Kaligawe corridor | 180 | 2 | 178 | 178 | **173** | **97.19%** | 1 | 173 | 145 |

The percentages are **fraction of land-classified pixel centers that pass a research-only QC predicate**; they are **not** the fraction of the AOI sinking, the probability of damage, risk scores or measured vertical displacement. The AOI polygons are illustrative rectangular bounds in `src/aoi-infrastructure-cases.js`, not legal/surveyed asset footprints. Calculated map-space pixel counts depend on the 80 m grid and pixel-center inclusion.

**Practical conclusion:** Kaligawe is the most promising location among these *three predefined illustrative polygons* for deeper InSAR **pixel-quality** QA. Its 173 qualifying pixels form **one 8-neighbor spatial cluster**, and even at coherence ≥0.9, 145/178 land pixels qualify. This says nothing about which area's terrain is sinking fastest. In contrast, Tanjung Emas has 74/149 qualifying land pixels split into four clusters, making its screening quality poorer and less spatially connected.

### Critical port location mismatch

The earlier BIG RBI **cartographic locator** `[110.42332243, -6.93749333]` is **outside** the seeded illustrative Tanjung Emas polygon (its northern boundary is latitude `-6.940`). That point has water mask `0`, coherence `0.342457...`, and NoData unwrapped phase. **Do not attach the polygon's 49.66% area-screening statistic to that point** or infer port asset motion. A proper surveyed/user-confirmed polygon or defensible area envelope needs to be checked before port-specific conclusions.

### Method, source and numeric definitions

1. Read **geocoded** `_corr.tif`, `_unw_phase.tif`, `_conncomp.tif`, and `_water_mask.tif` directly with Rasterio. All have **EPSG:32749**, **80 × 80 m nominal pixel spacing**, and **541 × 1312** aligned grids.
2. Transform each source illustrative AOI WGS84 polygon into EPSG:32749; include pixels whose **centers** fall within a polygon (`rasterio.features.geometry_mask(..., invert=True, all_touched=False)`).
3. Count `land = water_mask == 1` with valid mask; count `jointValid = land && valid coherence mask && valid unwrapped phase mask && valid conncomp mask && conncomp > 0`.
4. Define the **analyst-selected** eligible QC pixel as `jointValid && coherence >= 0.7`. Count individual eligible pixel centers; use eight-neighbor connected-component labeling on the threshold mask for QA spatial continuity. This is *not* the SNAPHU connected-component reliability certificate.
5. Keep the fraction denominator `all land pixel centers`, not `only jointValid`, to avoid inflated data availability. Water-mask uncertainty near coast remains a limitation. Pixels passing a threshold may still have unwrapping, atmospheric, reference or other systematic errors.

**Avoid the radar-coordinate GeoTIFF trap:** `*_rdr.tif` contains range–doppler arrays; they do **not** carry usable WGS84 geographic pixel grid coordinates despite a generic EPSG:4326 header returned by GDAL. Use the *geocoded* set only for these AOI overlays.

### Scientific blockers still open

- The uploaded HyP3 README explicitly says **no atmospheric correction** and describes the *unwrapped phase as relative to an internal SNAPHU reference*. Neither reference stability nor unwrapping quality has been independently validated.
- The product is **one 12-day interferogram**. No valid 2026 LOS displacement time series, sustained vertical trend, 2026 Multi-GNSS/levelling corroboration or infrastructure risk ranking exists yet.
- Product parameter text reports **`Baseline: 16.7183976478018`** while independent ASF baseline stack analysis for the pair yielded **−16 m**. These are separate signed/method-specific metadata and are **not treated as an exact scientific equivalence**; the orbital baseline definition/reference convention should be reviewed.
- Do not publish annual mm/year or asset-risk results until a multitemporal processed network, atmosphere/ramp/reference QC, adequate land coverage, uncertainties and GNSS comparison pass.

**Next:** in #42 review full-burst baseline metrics for additional temporally connected pairs, verify coherence on the intended source AOIs across dates, choose an economical minimum eligible stack and obtain explicit approval before running more HyP3 jobs. MintPy #43 follows processed actual multi-pair products.

## Data provenance

Sanitized numeric research summary: [`data/semarang-hyp3-aoi-pixel-screening-20261118.json`](../data/semarang-hyp3-aoi-pixel-screening-20261118.json). This repository contains **no operator TIFF, raw ZIP, Earthdata token or unapproved exact asset boundaries**. The uploaded pixels were inspected in the analysis environment; original source files remain on the operator Mac.
