# BARUNA Sentinel — RGPD Engineering Gap Closure (Iteration 2)

Status: implemented as prototype code. No claim of independently audited geodetic accuracy, asset safety or a commercial operator deployment.

## 1. Decision chain and evidence provenance

| Stage in RGPD proposal | Current implementation | Remaining scientific/operational gate |
|---|---|---|
| Multi-GNSS observation quality | Real BAKO IGS QC and locally user-supplied observation QC (labelled) | Same-day 2026 CSEM and CSMG raw RINEX QC; official equipment metadata and authenticity |
| Historical station vertical movement | 3,561 historical 2010–2021 CSEM GPS-derived epochs, descriptive OLS trend | Estimate defensible temporal-noise-aware uncertainty; check seasonal, frame offsets, station changes |
| Published station contrasts | New same-paper 2021–2023 CSMG −94.03 / CSEM +3.23 mm/year PPP reference panel | Paper data remain published results, **not** new BARUNA solution; do not mix with independent 2010–2021 OLS |
| Asset spatial intake | Local GeoJSON WGS84 Point/Polygon/MultiPolygon parser, CRS / geometry / ID validation; Leaflet mapping | Owner-approved asset polygons and survey metadata; source authority, positional accuracy |
| Relation of stations to assets | Great-circle distance to CSEM and exact known station coordinates | Distance is only proximity. Need validated asset-specific benchmark/GNSS or an engineering-approved association method |
| Exposure and criticality | User-declared attributes accepted with provenance warnings; inspectable evidence gaps | Licensed DEMNAS and official shoreline; vertical datum alignment; owner-approved criticality matrix |
| Inspection priority | Real imported and historical assets block as DATA_INSUFFICIENT; separate transparent synthetic policy computes tiers | Operator-approved thresholds, representative measurements and qualified geodetic/asset engineering review |
| Reports | Printable detailed asset gaps, historic source report, separate synthetic annex | Operational sign-off and asset ownership authorization; versioned backend persistence only after pilot acceptance |

## 2. Code paths

- src/published-cors.js — validated peer-reviewed CSMG/CSEM station contrast (2021–2023)
- src/asset-evidence.js — pure strict GeoJSON import and station-to-asset data-sufficiency gates
- src/asset-intake-ui.js — browser-local upload, Leaflet spatial visualization, per-asset requests and print report
- src/assessment-ui.js — Published evidence / Import asset GeoJSON / Synthetic policy demo

No asset file is sent to a backend or committed by the application. Import state is intentionally session-local and resets on page reload. The prototype does not retain any user-supplied geospatial data in a database.

GeoJSON v1 input:
- FeatureCollection with 1–50 features; file at most 1.5 MB.
- WGS84 / EPSG:4326 longitude-latitude only, feature geometry Point / Polygon / MultiPolygon.
- Required properties: asset_id (2–48 safe characters), asset_name (2+ characters).
- Optional: geometry_source, survey_date (YYYY-MM-DD), data_owner, exposure (high/moderate/low), criticality (high/moderate/low).
- Geometry is parsed and mapped; source and exposure/criticality remain user-declared and **not verified**.
- Polygon proximity uses bounding envelope centre as approximate **context only**; this is not a surveyed asset point or deformation sampling location.

## 3. Focused second-opinion research

**Independent literature review — NOT human expert validation.**

1. USGS (Langbein, 2020) explains that GNSS rate precision can be materially affected by temporally correlated noise and that different methods lead to different uncertainty estimates: https://www.usgs.gov/publications/methods-rapidly-estimating-velocity-precision-gnss-time-series-presence-temporal
2. IGS and GNSS reference station stability/offset literature warn about antenna monument changes, coordinate frame effects, and rate uncertainty: https://doi.org/10.1093/gji/ggv455
3. Sitaningrum & Widjajanti (2024), JGISE, shows different station PPP vertical trends at CSMG and CSEM in **2021–2023**: https://doi.org/10.22146/jgise.95957
4. ISO 55001:2024 asset management practices require documented decisions, asset context and the uncertainty of information; risk and resource prioritization must consider impacts and evidence: https://www.iso.org/standard/83054.html

This does NOT independently validate BARUNA's methods or convert user-declared attributes into certified engineering measurements.

### Requested human second opinion
Ask a practising geodesist/GNSS analyst to review reference frames, trend uncertainty, station changes and whether local measurement represents selected assets. Ask an asset-integrity/port maintenance engineer to review what "priority" is an authorized inspection trigger and how criticality is defined. Their sign-offs belong in a future pilot, not in the competition prototype.

## 4. Why source separation is mandatory

- CSEM GPS-derived 2010–2021 time-series OLS is **different data and processing** from published CSEM PPP 2021–2023.
- BAKO 2025 QC is **not** a displacement solution at CSEM or CSMG.
- Three–seven days of same-date CORS RINEX can verify observation completeness and constellation availability. It cannot independently establish an annual settlement trend.
- Surveyed or user-uploaded polygon proximity to CSEM establishes **only geographic distance**. Without an on-site benchmark/representative measurement, it cannot rank deformation or predict structural failure.
- Unverified data are never treated as zero movement, stability, low risk, or real inspection instructions.

## 5. Minimum next data acquisition

P0 for the Bhumireka evidence demo:
1. Two already discussed BIG CORS RINEX ZIPs. Verify header station identity and actual dates first. If CSEM/CSMG observations cover different days, request matching observation days. Navigation, antenna and official reference metadata as available.
2. One authorized asset GeoJSON with asset_id / asset_name / survey_date / geometry_source / owner. Never re-label the 2005 published six sectors as real surveyed polygons.
3. If available: asset-specific benchmark levelling or an on-site GNSS position series, with method, dates, uncertainty and reference datum.
4. Coastal exposure and criticality only after confirming licensed DEMNAS/coastline sources and asset-owner operational context.

P1 after data:
- Same-day QC side-by-side for actual CSEM and CSMG.
- Robust station-level trend uncertainty, discontinuity and frame checks.
- Operator-approved exposure criteria, criticality, and auditable screening thresholds.

Do not spend competition time on login, subscription billing, a new backend, or an invented coastal hazard surface.
