# Real ASF HyP3 InSAR — Semarang Coastal QA (17 November 2026)

## Operator-facing decision

**GO** for displaying a real 12-day Sentinel-1 interferometric **measurement quality/research screening** result in the Bhumireka demonstration.

**NO-GO** for claims of port asset subsidence, annual vertical motion (mm/year), flood depth, or risk ranking.

This release updates the **Real Workspace** source evidence area at `real-workspace.html`, not the **fictional scenario** at `spatial-demo.html`. No fake deformation raster/heatmap is introduced.

## Source and provenance

The source for `data/semarang-real-hyp3-insar-qa.json` was the user's actual ASF HyP3 ZIP:

- Product: `S1_162214_IW2_20261002_20261014_VV_INT80_5087.zip`
- SHA-256: `705b15ce1ba6586d859abe110a62423fd20241dfcb00947dfc5af223eb4b2a2b`
- Job: `a96410b0-1418-4e8b-a191-ab6f40e3e615`
- Acquisition: 2 Oct to 14 Oct 2026, VV descending, `076_162214_IW2`
- ASF HyP3 ISCE2 2.6.5; 80 m; EPSG:32749; source DEM Copernicus GLO-30 (**NOT official BIG DEMNAS**)
- Source AOI: `[110.375,-7.025,110.485,-6.875]` in EPSG:4326
- Original product includes coherence, wrapped/unwrapped phase, water mask and connected components
- Full scientific QA source was performed from real GeoTIFF pixels and archived separately from the public application (not committed as raw operator data)

## Result and its denominator

- 31,464 raster centers in the AOI
- 16,542 water-mask-land raster centers with finite unwrapped phase and valid coherence
- 15,105 / **16,542** (91.31%) meet the coherence ≥0.7 and component 1 research screening criteria
- This is **not** 91.31% of the whole AOI and not accuracy or a validated subsidence extent

BIG RBI Tanjung Emas `Pelabuhan (Titik)` layer 861 is a **1M-scale cartographic point**, **not a surveyed asset**.

At [110.42332243, -6.93749333]: coherence 0.342, water mask 0, unwrapped phase **NoData**.
Within 500 m, 0/122 grid centers pass the combined QC criterion; within 1 km, only 3/489 pass.

Do not substitute the port cartographic point for a surveyed quay, pier, road or GNSS station. One relative interferogram may contain atmospheric/unwrapping contributions. LOS-to-vertical projection and time-series rate require additional assumptions and external validation.

## What the app now does

- Loads a static, schema-checked, SHA-associated QA manifest.
- Displays real provenance, QC-screened pixels with **correct denominator**, and an explicit port NoData state.
- Preserves an archived ASF SLC candidate section for research provenance, without claiming this older catalogue was the actual InSAR processing.
- Adds the source QA snapshot to exported Evidence Brief; **annual vertical rate and validated port LOS displacement remain null**.
- Keeps the existing `realInsar` science gate **blocked**, representing verified geodetic deformation, **not** inability to generate interferometric products.
- Does **NOT** put a synthetic heatmap on the map and does **NOT** claim raster overlay is deployed. Real coherence and quality-masked phase GeoTIFF are in the separately prepared QA handoff package; if a live map overlay is desired, deploy a genuine georeferenced and source-verified raster derived from them and test its alignment first.

## Test and deploy

```sh
npm test
node --check src/real-hyp3-insar.js
npm run build
```

To inspect: navigate to `/real-workspace.html` → `04 / Evidence Gate` → `InSAR Measurement Quality`.

Source documentation: https://hyp3-docs.asf.alaska.edu/guides/burst_insar_product_guide/
