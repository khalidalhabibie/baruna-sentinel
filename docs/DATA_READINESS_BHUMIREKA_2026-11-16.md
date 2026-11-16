# BARUNA Sentinel — Data Readiness & Simulation Decision
**Snapshot:** 16 November 2026 · **Target:** BIG Bhumireka, 18–19 November 2026  
**Decision:** FREEZE VIDEO DATA SCOPE. Use source-backed BMKG forecasts + optional local GNSS QC, and clearly labeled synthetic fallbacks. Do not delay video waiting for DEMNAS or InSAR.

## Definition of statuses
- **SOURCE-BACKED:** source data is present with explicit provenance; it is *not* automatically validated for claims beyond its domain.
- **LOCAL PRIVATE:** real user-owned input, loaded only in the current browser session.
- **CATALOGUE ONLY:** published item/layer metadata exists, but pixel/geometry datasets have not been obtained and validated.
- **SYNTHETIC VIDEO:** invented UI fixtures, never official measurements or risk scores.
- **PENDING:** unavailable; no result computed.
- **DEFERRED:** out of scope for this video.

## Exact source inventory
| ID | Provider / data | Status in current video implementation | Available evidence | Missing data and gate | Video decision |
| --- | --- | --- | --- | --- | --- |
| 01 | BIG Ina-CORS CSEM/CSMG GNSS observation | LOCAL PRIVATE | Previously downloaded RINEX; source-backed QC only after private JSON import | Genuine per-station observation QC JSON and timestamp checks in browser; QC alone cannot yield velocity/subsidence | Optional QC upload, **never** substitute fake QC |
| 02 | BIG CSEM/CSMG numeric XYZ/ENU series | SYNTHETIC VIDEO; official numerics PENDING | Official station/portal context; no downloadable numeric series | Time-stamped coordinates, frame & epoch, offsets, uncertainty, time zone and provenance | Synthetic three-axis plot (Jan 2022–Oct 2026 monthly **invented**), conspicuous label |
| 03 | BMKG Semarang tide | SOURCE-BACKED FORECAST | User-exported 16–22 Nov 2026 CSV: **1,008 timestamps / 10-minute interval**; MSL range **−0.48 to +0.53 m**; 24 high/low extrema; validator and fallback implemented | CSV lacks time-zone offset: UTC interpretation comes from portal screenshot; confirm forecast issue time and local MSL definition if using elsewhere | Show actual **forecast** plot for 18/19 Nov WIB; never say observed or imply rob prediction |
| 04 | BIG DEMNAS elevation | SYNTHETIC VIDEO | Official ImageServer returns GeoTIFF download URLs; native specification per BIG: 0.27 arcsecond, EGM2008, geographic coordinates, GeoTIFF Float32 | **Valid DEM pixel values not established**; exported resampled raster is not automatically the original NLP tile; verify NoData, CRS, spatial bounds, grid resolution, vertical datum and profile | Keep clearly labeled synthetic elevation profile |
| 05 | GIS Kota Semarang rob, banjir, drainase | CATALOGUE ONLY | Relevant official layer names and portal link | Actual licensed GeoJSON / WFS/OGC layer, coverage, update date, CRS, valid geometry | Explain layer availability, do not render official hazard polygons |
| 06 | Copernicus Sentinel-2 | CATALOGUE ONLY | L2A products dated 14, 21, 22 Oct 2026; cloud-cover product metadata from Copernicus | Actual imagery downloaded, band/product quality checks, AOI cloud inspection, acquisition and license | Metadata cards only; **no satellite-derived metrics** |
| 07 | Copernicus Sentinel-1 InSAR | PENDING | Relevant portal and methods identified | Compatible SLC multi-temporal stack, orbit / geometry, reference, co-registration, unwrapping, error estimation, independent validation | **No InSAR deformation/subsidence metrics** |
| 08 | Real infrastructure geometry/survey | SYNTHETIC VIDEO; operator data PENDING | Three fictional sector cards and schematic | Operator-approved asset IDs, georeferenced geometry, survey dates, vertical datum, uncertainty, rights | Keep 'DEMO' assets and recommend field verification only |
| 09 | BIG BATNAS | DEFERRED | Service known | Appropriate nearshore question, bathymetric datum & validated data | Do not add for Bhumireka video |

## Explicit **data required after the event**
1. **Official GNSS numeric daily series** for CSEM and CSMG: timestamp, XYZ or ENU, terrestrial reference frame/epoch, antenna changes, processing method, uncertainty and official provenance.
2. **Actual DEMNAS raster** for the Tanjung Emas / Semarang Utara AOI: GeoTIFF, CRS, native/derived resolution, EGM2008, NoData mask, lineage/license. Validate pixels before enabling source-backed elevation.
3. **Semarang GIS layer geometry**: export or API response with feature geometry, date, source/layer name, CRS and usage rights.
4. **One actual Sentinel-2 L2A scene** with acquisition metadata and correct AOI validation; no invented cloud-free image.
5. **Operator asset geometry and surveyed control** if moving beyond illustrative workflow.
6. **Sentinel-1 SLC series** only as a separate, validated research and processing phase.
7. **BATNAS** only if a specific bathymetric question emerges.

## Provider integration gates
Every replacement must go through: **original unmodified file/API response → source metadata → CRS/time zone/vertical datum/unit checks → NoData / coverage / quality validation → normalized adapter → provenance-aware UI → optional spatial join**.

- **Do not silently change synthetic values to 'REAL'.**
- **Do not mix tide local MSL with DEMNAS EGM2008 height directly.**
- **Do not infer station-to-asset land subsidence or structural safety from GNSS epoch QC / tidal forecasts.**
- **Do not bundle private RINEX files or operator geometry in a public static site.**

## What the video can genuinely demonstrate now
1. **Source readiness:** known BIG CORS and optional private, real epoch QC, with simulated ENU clearly marked.
2. **Regional context:** actual BMKG Semarang *forecast*, clearly distinct from synthetic DEMNAS elevation and Copernicus catalog metadata.
3. **Asset workflow:** fictional sectors on a non-georeferenced schematic.
4. **Verification brief:** request real field survey and geometry; no safety rating, subsidence speed or rob classification.

**Ship criterion:** all four scenes render; BMKG CSV successfully validates when served from the static build; 18/19 Nov WIB tabs function; synthetic fallback labels remain visible; no misleading result claims; the demo can run locally if Vercel rate limits persist.

**Related artifacts:** [Video capture guide](./VIDEO_CAPTURE_SYNTHETIC_DATA_PLAN.md) · [demo route](../video-demo.html) · [BMKG adapter](../src/bmkg-tide-adapter.js) · [synthetic GNSS ENU](../src/synthetic-gnss-series.js)
