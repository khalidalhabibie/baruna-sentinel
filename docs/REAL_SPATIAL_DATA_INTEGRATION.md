# BARUNA — real spatial evidence integration (Semarang, 16 Nov 2026)

## Source ZIP and processing

The user provided `BARUNA_GENERATED.zip`, created using
[Ourdo/sentinel-helpes](https://github.com/khalidalhabibie/sentinel-helpes),
containing:
- `generated/semarang_dsm.tif`: Copernicus DEM GLO-30 **DSM** WGS84, 396×540 pixels, 100% valid data in the exported raster. Input SHA256: `535f007265ab447925d227a6816943b708691501033780e116f7a7847e86bef5`.
- `generated/semarang_dsm.json`: mosaic provenance and analytical limitations.
- `generated/sentinel1_scenes.geojson`: 11 authentic Sentinel-1 GRD scene footprints.
- `generated/sentinel2_scenes.geojson`: 16 authentic Sentinel-2 L2A scene footprints.
- `generated/mvp_readiness.json`: 2026-11-16 source validation and missing-data flags.

The full-resolution GeoTIFF stays in the user's local helper repository.
Static web delivery uses an **actual-data downsampled preview**:

- `data/semarang-dsm-preview.json`: 72×98 grid, resampled from source
  396×540 raster with average resampling, quantized to 0.61 metres per
  code; zlib-deflate/base64 encoding. Missing-code 255. CRS EPSG:4326,
  AOI west/south/east/north `[110.375,-7.025,110.485,-6.875]`.
  This is a **display preview**, NOT suitable for asset-level samples,
  exact parcel elevation, or engineering hydrological calculations.
- `data/semarang-sentinel-scenes.json`: 27 actual scene footprints
  (longitude/latitude WGS84 rounded to five decimal places),
  product IDs, acquisition dates, and Sentinel-2 **whole-tile** cloud percentages.
- `data/semarang-real-readiness.json`: evidence provenance and
  computational permissions/blocks.
- `src/real-spatial-evidence.js`: client-side DSM image overlay, on-map
  sample context, scene selector/footprint and explicit evidence gates.

## UI

At `/spatial-demo.html#real-evidence`, the real-source panel is inserted
immediately below the illustrative scenario map. It uses the **same map**
for DSM overlay and selected scene footprint.
The four fictional assets and their synthetic inspection ranking are
**unchanged and clearly segregated** from these data.

Clicking a map location displays only an approximate height from the
coarsened **DSM preview grid**. Do not read it as a surveyed asset elevation.
The scene selector draws real footprint geometry; it does **not**
display satellite imagery because scene pixels are still missing.

The standalone `dist/baruna-spatial-demo-standalone.html` remains an
offline **synthetic video** and intentionally does not attempt to fetch
external data or use the real dataset module.

## Readiness and no-go gates

| Capability | State |
|---|---|
| Real DSM context overlay | READY — surface height only |
| Selecting actual Sentinel scenes | READY — metadata/footprints only |
| Real Sentinel-2 NDWI, vegetation, change analysis | BLOCKED — spectral pixels and AOI cloud mask missing |
| Real InSAR/ground subsidence from Sentinel-1 | BLOCKED — suitable SLC acquisitions and geodetic processing missing; GRD is not displacement |
| Rob/flood-depth model from DSM and BMKG | BLOCKED — datum transformation, model validation and other inputs missing |
| Inspection priority of actual port assets | BLOCKED — surveyed asset geometry and representative measurements missing |

## Updates and verification

When source data changes, regenerate the public representation from the
helper repository, perform source validation, and update these three
JSON assets together. Never substitute randomly generated values for
unavailable measurements. Do not commit private BIG RINEX archives,
unlicensed data, or sensitive asset survey geometry.

CI runs `npm run check` with tests for grid size, bounds, scene IDs,
sensor counts and blocked conclusions, and includes all required files
in the Vercel static artifact.

## Real four-band Sentinel-2 L2A addition (16 Nov 2026)

A source-verified GeoTIFF was supplied as `BARUNA_SENTINEL2_REAL.zip`:
- Scene `S2B_T49MDN_20261014T025716_L2A`, acquisition 14 Oct 2026 02:59:51 UTC.
- Four bands B03, B04, B08 (10 m), SCL (20 m aligned to the 10 m 4-band source COG).
- EPSG:32749; 1218×1660 source pixels; source SHA-256 `d398e1af132b23fb3daecaf6477ed8f142d25dd02b6b3218a5c572c15d294363`.
- The source COG (12.75 MB) is NOT committed. Only a georeferenced WGS84 72×98 **actual-data-derived** NDWI preview is public in `data/semarang-s2-ndwi-preview.json`.
- Calculation used band reflectance DN×0.0001−0.1 and valid SCL classes 4,5,6; natural 10 m source NDWI percentiles P10/P50/P90 −0.3848 / −0.0816 / +0.4291. Rendered preview is downsampled and quantized, NOT suitable for parcel/asset analysis.
- Real Workspace now provides a user-selectable NDWI layer alongside the existing DSM. Each uses its own legend; only one overlay is visible at once. The selected 14 Oct scene is clearly labeled as having real optical pixels; other STAC scenes remain metadata only.
- `modelGate.singleDateNdwiPreview` is true when the committed source-derived preview is valid, but `modelGate.realOpticalAnalysis` **remains false** because change detection and validated inundation models are not supported. SCL water class is NOT flooded area.
- The source byte hash, grid byte hash, CRS, temporal metadata, band names and scientific no-go gates have Node tests.
- The existing scenario/demo and synthetic rankings remain isolated. No Sentinel-1 InSAR, flooding, or operational asset scoring is introduced.

**Catalogue identity warning:** The imported real 14 Oct 2026 Earth Search scene ID differs from the existing 14 Oct Copernicus CDSE STAC product ID. Treat them as independent source records; a coincident date/tile is not proof of identical product lineage. The optical layer uses the Earth Search scene with independent provenance. The original 16 CDSE records remain metadata-only.
