# BARUNA P1 Data Integration — BIM/BIG Bhumireka 2026

This **local-first** tool lives at `/pilot-data-lab.html`. It adds defensible input gates without falsifying a delivered PPP displacement or DEMNAS surface.

## What is actually implemented

1. **Local CSEM/CSMG observation QC.** Reuses `scripts/local_cors_qc.py` and `src/station-qc.js`; accepted user files contain station-day observation availability, epoch coverage and constellation counts, **not a solution of coordinates**. Source identity is user-declared and should be verified with the SRGI owner.
2. **Externally processed multi-GNSS position series intake.** Supports a strict JSON format from a qualified PPP/network processor, including station name, two-or-more constellations, reference frame, original RINEX archive SHA, dated Up positions and per-epoch formal uncertainty. A 2026 campaign shorter than a year is **never** extrapolated to mm/year. Even a longer descriptive OLS remains source-unverified and not asset-ready until audited independently.
3. **Actual BIG DEMNAS image-service Identify endpoint.** Official service: https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer . ImageServer responds at selected Semarang tests with `value: 1.13427e+38` (NoData, not elevation), as observed in direct checks 17 November 2026. Reject any result outside −500 to 9000 metres rather than using fallback `properties.Values` from other mosaic overviews. A valid numeric response, if one appears, still needs vertical datum review and never becomes a flood depth estimate.
4. **Locally processed user-provided DEMNAS GeoTIFF** via `scripts/prepare_demnas_preview.py`. Rasterio maps authorized GeoTIFF cells to a 20×20 WGS84 preview covering the fixed Semarang AOI. Values outside physically plausible bounds, missing coverage and source uncertainty remain null. SHA-256 of the original file is included; the preview is **not** proof the GeoTIFF came from BIG. Copernicus GLO-30 is not treated as DEMNAS.
5. **Station–asset geometric proximity.** Users supply one WGS84 GeoJSON Point (CSEM/CSMG) and one Polygon asset. BARUNA reports shortest point-to-polygon separation as an approximate geometric distance, with strict "user-declared" label. Zero distance does not establish a geodetic connection, movement correlation, physical condition, or ranking.

Everything is read within the browser and the report exports **summary only**; raw GeoJSON geometry, coordinates and full position epochs are not included in the exported audit document.

## Official data sources

- BIG Ina-CORS / SRGI: https://srgi.big.go.id/page/unduh-data-rinex
- BIG DEMNAS ImageServer: https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer
- BIG Ina-Geoportal DEMNAS download: https://tanahair.indonesia.go.id/
- BIG's 2024 DEMNAS download instructions: https://tanahair.indonesia.go.id/portal-web/static/Panduan%20Unduh%20Data%20Demnas.pdf

BIG Ina-Geoportal typically requires login for DEMNAS downloads. A URL pointing to the ImageServer does **not** by itself establish that the pixel is valid. If using private or restricted government survey data, obtain permission from the data owner; do not upload raw internal GNSS, receiver metadata or GeoTIFFs to GitHub.

### GeoRinex 1.16.2 RINEX2 PRN 36 compatibility

Authentic BIG 2026 CSEM/CSMG RINEX2 observation archives can fail with `IndexError: index 36 is out of bounds for axis 2 with size 36`. GeoRinex `obs2.py` hardcodes `Nsvsys=36` per satellite constellation and may encounter PRNs `37+` (for example BeiDou) in mixed RINEX2 input. **This alone does not prove bad or corrupted BIG observations**. To keep this prototype QC reproducible without patching site-packages, the local observation parser explicitly requests only **GPS (G), GLONASS (R), Galileo (E)** from GeoRinex. BeiDou (C), QZSS (J), SBAS (S), NavIC (I) are **NOT ASSESSED** and must not be described as absent or invalid. A comprehensive all-system constellation audit needs a compatible receiver/decoder and independent geodetic review.

If QC is blocked, update both sibling repositories and rerun:
```bash
cd /Users/macpro/Code/bhimerka/baruna-sentinel && git pull origin main
cd ../sentinel-helpes && git pull origin main
bash run.command --p1-data --offline --process-local --app-repo ../baruna-sentinel
```
Parser failures now identify the original station-day file. The helper stores a local-only diagnostic log. Genuine decoded coverage must be obtained before treating QC as completed; the station velocity, subsidence, asset ranking and geodetic precision remain **not computed**.

## One-ZIP private handoff workflow (17 November 2026)

When `sentinel-helpes` has produced an audited P1 handoff, use the original local file
`BARUNA_P1_QC_HANDOFF_YYYYMMDD_HHMMSS.zip` directly. Open `pilot-data-lab.html`, select
**ZIP handoff or QC JSON**, and review station-by-day coverage plus the archived-date gaps.
No server upload, persistent storage or source commit takes place. A ZIP import cross-checks
record count, 30-second epoch coverage, G/R/E pseudorange counts, full-day status, long gaps,
and missing dates against `audit/QC_SUMMARY.json`. JSON-only fallback is permitted but has
no independent handoff-summary check.

Open `evidence-brief-coaster.html`, choose the same local ZIP under **Lampiran opsional /
Observasi GNSS lokal 2026**, then print or save the brief if an evidence annex is needed.
The previously published 2021–2023 PPP velocity and the 2026 local observation QC are different
sources, never silently combined. `DATA INSUFFICIENT` and zero real-asset rankings are unchanged.
CSEM/CSMG station-day observations cannot establish coastal asset subsidence rates or receiver uptime.

**Security boundary:** The repository is public. Never commit the ZIP, raw RINEX, private QC JSON,
receiver coordinates, source archive hashes, or derived station-day details. Data are only opened
locally by the owner's browser. For deployment, `scripts/build-static.mjs` includes the reader
module but intentionally excludes the observations and ZIP.

## Processing the existing CSEM / CSMG RINEX archives

On the owner's MacBook after placing the authorized ZIPs locally:

```bash
python3 -m pip install georinex numpy
python3 scripts/local_cors_qc.py --csem /private/CSEM.zip --csmg /private/CSMG.zip --output /private/CSEM_CSMG_QC.json
```

Open `/pilot-data-lab.html` and select the resulting JSON under **QC RINEX CSEM + CSMG**. The application validates the count and timeline. It deliberately does not compute an annual rate or official station coordinates.

**GNSS solution requirement:** If an expert subsequently produces a multi-year, reference-frame-consistent daily PPP/network position solution, provide a *separate* JSON under **Seri koordinat multi-GNSS** with this schema:

```json
{
  "schema": "baruna-processed-multignss-station-series-v1",
  "station": "CSMG",
  "sourceMode": "USER_SUPPLIED_PPP_SOLUTIONS_NOT_SOURCE_VERIFIED",
  "processing": {
    "method": "PPP",
    "referenceFrame": "Verified frame identifier from solver",
    "processor": "Qualified processor name",
    "rinexArchiveSha256": "64-character SHA-256",
    "constellations": ["GPS", "Galileo"]
  },
  "epochs": [
    {"date": "2026-11-15", "upMeters": 0.001, "sigmaUpMeters": 0.006},
    {"date": "2026-11-16", "upMeters": 0.001, "sigmaUpMeters": 0.006}
  ]
}
```

**All numbers in the JSON above are illustrative format examples, NOT measurements or a valid solution.** This example correctly remains `INSUFFICIENT_SPAN_OR_CONTINUITY`. Never treat user-declared processor/frame metadata as independently authenticated.

## Processing official DEMNAS GeoTIFF

Download the authorized GeoTIFF through Ina-Geoportal, then convert *locally*:

```bash
python3 -m pip install rasterio numpy
python3 scripts/prepare_demnas_preview.py \
  --input /private/DEMNAS_original_or_mosaic.tif \
  --output /private/BARUNA_DEMNAS_preview.json
```

Import the JSON in the **Impor preview GeoTIFF DEMNAS** section. It contains a 20×20 sampled preview plus checksum, not the original-resolution tile; a single tile may cover only part of the AOI. Never substitute DEMNAS heights for a benchmark, geotechnical survey, tide datum, or measured flood extent.

## Station and asset GeoJSON

Provide **two separate files**, each a `Feature` (or `FeatureCollection` containing exactly one Feature):

- Station: `geometry.type="Point"` with `coordinates: [longitude,latitude]` and `properties.stationCode="CSEM"|"CSMG"` plus `properties.sourceReference`.
- Asset: `geometry.type="Polygon"` with a single non-self-intersecting closed ring within the supported Semarang bounds and `properties.assetId` and `properties.sourceReference`.

`sourceReference` is simply a traceable note, *not verification* that BIG or the operator approved it. No official asset polygons or certified station coordinates are shipped or manufactured by BARUNA.

## Honest open tasks after P1

- **Not available:** verified, recent CSEM/CSMG multi-GNSS PPP/network-adjusted coordinate series with a consistent reference frame and temporal uncertainties.
- **Not available:** licensed DEMNAS GeoTIFF/mosaic that returns usable **actual** surface cells over the selected Semarang AOI and has a reviewed vertical reference.
- **Not available:** operator-endorsed asset boundaries, on-/near-asset benchmark survey and engineering proof that station motion is representative of specific assets.
- **Not available:** validated criticality policy, reviewed condition assessments, or any real-asset risk/inspection ranking.

These are genuine pilot dependencies, not missing button labels. The preserved outcome is `DATA_INSUFFICIENT`.
