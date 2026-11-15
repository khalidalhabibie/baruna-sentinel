# BARUNA Sentinel — evidence acquisition checklist for RGPD 2026

Implementation checklist, **not** a requirement to procure everything before showing the prototype.

## Already in the repository

| Source | Available file / module | Legitimate use |
|---|---|---|
| Published Tanjung Emas field observations | data/tanjung-emas-historical-field-evidence.json | Six 2005 cumulative settlement ranges for verification requests |
| Historical CSEM positions (2010–2021) | data/CSEM_clean_Noff1site.source-derived.rneu | Descriptive GPS station-level trends and limitations |
| IGS BAKO observation QC (1 Jan 2025) | data/BAKO_IGS_2025-001_20min_qc_summary.json | Multi-constellation observation-quality proof for BAKO, **not Semarang** |
| Public geographic reference points | src/geo.js | Station / landmark context only |

These three independent streams are not a single multi-GNSS displacement solution or modern port-asset condition assessment.

## Additional data, in priority order

### P1 — More GNSS evidence at Semarang stations
- **Input:** Official BIG Ina-CORS CSEM and CSMG daily RINEX observation files for matching days; corresponding navigation / ephemeris files when available; official antenna/receiver metadata and reference coordinates.
- **Suggested demonstration set:** 3–7 matching days, for example 2026-11-10 through 2026-11-16 if available. One day per station is useful for QC; several common days help reveal continuity differences.
- **Processing:** Epoch count, expected sampling interval, gaps, missing periods, satellite constellations, pseudorange availability, station metadata, and recorded provenance.
- **Limitation:** A 3–7 day sample does **not** establish an annual subsidence rate, a positioning accuracy improvement, or structural movement. Long-term trends need suitable longitudinal station solutions with a defined reference frame.
- **Rights:** Check BIG/SRGI license and permitted redistribution. Raw archives should stay local until terms permit public release.

### P1 — Actual site geometry
- **Input:** Asset/survey-point identifier, authoritative geometry (GeoJSON / GeoPackage / shapefile), CRS/EPSG, acquisition date, accuracy, owner authorization, and license.
- **Suggested fields:** asset_id, asset_name, geometry, crs, source, survey_date, positional_accuracy_m, owner_authorization.
- **Use:** Scientifically defensible station-to-asset spatial relation. Historical field-sector polygons remain unlocated until such geometry exists.

### P2 — Longitudinal station positions
- **Input:** CSEM and CSMG station position series spanning more than one year, dates, NEU/XYZ coordinates, uncertainty, reference epoch/frame, antenna changes, discontinuities, source and license.
- **Use:** Compare station-level historical trends under suitable processing assumptions.
- **Limitation:** A station trend is not automatically movement on a port asset.

### P2 — Coastal exposure
- **Input:** Licensed DEMNAS elevation, authoritative shoreline, infrastructure layer, CRSs, vertical datums, publication date, and provenance.
- **Use:** Preliminary spatial exposure screening after datum alignment.
- **Limitation:** A DEM is not an engineering elevation survey or flood probability estimate.

### P2 — Operational criticality and screening policy
- **Input:** Authorized asset inventory, criticality, inspection history, incident criteria, maintenance owner, and geodetic/engineering reviewer.
- **Use:** Operator-approved, auditable inspection-screening rules.
- **Limitation:** No structural safety certificate or failure probability without validated methods and relevant asset observations.

## First user upload requested, if available

Prioritize the two previously mentioned BIG CORS RINEX ZIP archives (CSEM/CSMG candidates), rather than downloading everything again. Verify the actual RINEX header station names, epoch dates, intervals and rights; ZIP filenames alone do not establish station identity. The files need not be committed to GitHub.

## RGPD prototype acceptance criteria

1. Show a source-backed historic observation with date, station, method and explicit limitations.
2. Analyze multi-GNSS observation QC without claiming a geodetic position solution.
3. Make missing site geometry, local measurement, reference frames and asset linkage visible.
4. Show a clearly marked **synthetic policy** with High/Medium/Monitor/Data Insufficient decisions and traceable rules.
5. Block real Tanjung Emas operational ranking until adequate evidence exists.
6. Export a useful assessment or verification brief, and never confuse simulated data with real evidence.
