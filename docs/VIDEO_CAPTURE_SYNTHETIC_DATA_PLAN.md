# BARUNA Sentinel — Video capture plan & data-replacement contracts

**16 November 2026** — A standalone, deliberately synthetic video showcase at \`/video-demo.html\`. Source-backed \`Assessment\` remains untouched. **Never describe mock values as BIG, BMKG, Copernicus or Pelindo measurements.**

## Why a separate route

A convincing 80–100 second demo should show how separate evidence sources *could* enable a data request/inspection verification workflow. We do not yet have officially validated vertical station series, per-asset surveys, geospatial masks, tide series or Sentinel imagery for this specific analysis. The mode therefore makes \`SIMULASI VIDEO / DATA KONTEKS & ASET FIKTIF\` permanently visible. It is not a deployment for infrastructure risk assessment.

## Capture path (example 90 seconds)

1. **0–18 s — SOURCE READINESS:** show real source categories and separate statuses. Optionally select **Impor JSON QC lokal** and use the user's real private CSEM/CSMG RINEX-derived QC JSON (expected private 30-day window, NOT included in repository). Say *“Kami telah memeriksa ketersediaan pengamatan GNSS, bukan menghitung penurunan tanah.”*
2. **18–39 s — CONTEXT:** select **02 / Konteks wilayah**. Elevation and tide charts are illustrative fixtures, visibly marked. Say *“Elevasi dan pasang surut dapat ditambahkan saat sumber dan datum sudah tervalidasi.”*
3. **39–61 s — ASSET:** select **03 / Sektor contoh**. Click DEMO-B to switch hypothetical sector. A schematic without latitude/longitude is intentional; no operator asset is mapped. Say *“Sektor di sini ilustrasi, bukan polygon resmi atau hasil inspeksi.”*
4. **61–90 s — VERIFICATION BRIEF:** select **04 / Verification brief**. The actual recommendation is **Memerlukan verifikasi lapangan**. Say *“Jika lokasi dan pengukuran representatif belum tersedia, sistem tidak mengeluarkan klasifikasi keamanan aset.”*

## Already available, vs future integrations

| Provider | Now | Replacement data contract and validation gate |
| --- | --- | --- |
| BIG Ina-CORS CSEM / CSMG | Private user RINEX-derived epoch QC via local JSON import; site logs public | Validate station/date, UTC/GPS day, counts, file provenance. Observation QC ≠ position trend. |
| BIG numeric CORS daily series | **PENDING**; only historical chart captures and a separate published study exist | Require actual XYZ/ENU date, ITRF realization/epoch, station identity, equipment offsets, uncertainty; never derive velocity from screenshots |
| BIG DEMNAS | **SYNTHETIC profile**, official ImageServer link | AOI raster sample, CRS, pixel size, vertical datum, mosaic date and no-data handling. Don't treat DEM as building settlement |
| BMKG tide | **SYNTHETIC curve**, official forecast download link | Real station, time zone, start/end, predicted vs observed, tide datum (referenced to DEM only after transformation) |
| Pemkot Semarang rob/drainage | **SYNTHETIC status** only | Licensed, dated GeoJSON / OGC service layer, geom validation, spatial join to surveyed asset polygon |
| Copernicus Sentinel-1/2 | **SYNTHETIC preview** only, no satellite metrics | Product IDs, acquisition UTC, orbit/mode/level, processing chain. Sentinel-1 InSAR needs co-registered SLC series, not just screenshot/GRD |
| Operator assets and survey | **SYNTHETIC sector diagram** | Licensed feature geometry with unique IDs, site-level measurements, datum, epoch, uncertainty, operator-approved gate |
| BIG BATNAS | Defer | Not needed for this video; relevant only if bathymetric/nearshore questions are added with validated datum |

Each source has a stable \`id\`, \`provider\`, \`status\`, \`source\`, \`next\` and \`role\` in \`src/video-fixture.js\`. The synthetic context is held in \`VIDEO_CONTEXT\` and fictional asset cards in \`VIDEO_ASSETS\`. **Do not switch any source to 'REAL' by relabeling: implement provider adapters and source-level validators before changing provenance status.**

## Privacy and claims

- Real RINEX ZIPs and private QC summaries are never checked into the public GitHub repository or bundled in \`dist\`.
- Importing a local QC JSON only keeps the parsed document in page memory (no browser storage, backend POST, service worker or network request). Reload to clear.
- Charts and schematic are fixtures, **not** spatial interpolation, visual evidence of flooding, land subsidence, or site risk.
- Footer and top banner always say the data/context/asset scene is synthetic; keep these visible in recording and don't crop them out.
- Don't present historical CSEM / CSMG publication velocities as measurements produced by the local 2026 QC import.
- Production Vercel deployment may be delayed by hosting rate limits. Use local \`npm run start\` after \`npm install\` to run \`http://localhost:4173/video-demo.html\` if needed; the source in \`main\` is authoritative once CI passes.
