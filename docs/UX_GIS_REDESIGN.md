# BARUNA Sentinel — UX & GIS Competition Release (15 Nov 2026)

## User outcome and architecture

**Primary job:** help a coastal infrastructure maintenance or asset-integrity team identify what evidence is present and what needs field verification before attempting a real inspection ranking.

Two modes share the **same** data, source checks and evidence export.

- **Decision View (default):** buyer/jury-friendly. Shows executive evidence readiness, a 3-step workflow (select a documented sector → review spatial evidence → prepare a verification brief), six **real historical research sectors**, map context and accessible help. Hides GNSS import, parser diagnostics and fabricated sandbox tiers.
- **GIS / Analyst:** original real GPS historical series, BAKO real multi-GNSS observation QC, chart, evidence-linkage guardrail, reference coordinate plot, layer toggles, WGS84 audit table, manual import, and illustrative scenario. Technical depth is visible on demand.
- No backend or database. All client work uses the statically deployed build and verified research extracts.

## UX corrections

| Principle | Implementation |
|---|---|
| Nielsen: system status | Visible case status, inline feedback by the guided workflow, error and busy states, `aria-live` announcements |
| Nielsen: real-world match | Selected infrastructure sector, verification request, evidence readiness language before GNSS jargon |
| Nielsen: user control | Explicit Decision / Analyst modes, map layer toggle undo, standalone return from OSM to offline plot, original import modes preserved |
| Nielsen: error prevention | Real CSEM fetch failure **never automatically loads synthetic observations**; failure shown explicitly |
| Nielsen: recognition | Selected sector and measurement year remain visible; guided steps connect choice to brief |
| Nielsen: flexibility | Novice path plus analyst station/RINEX controls without fragmenting app data |
| Nielsen: minimalist design | Expert-only diagnostics hidden from default view; concise help available on disclosure |
| Shneiderman: informative feedback | Sector selection, filter change and layer changes announced |
| Shneiderman: closure | A three-step workflow ends in a source-traceable, printable evidence brief |
| Fitts / Hick | Clear primary action and 44 px targets; fewer default choices |
| Accessibility baseline | Skip link, visible keyboard focus, `aria-pressed` and `aria-busy`, labelled group controls, structured geographic table |
| Mobile | Stacked KPI and actions, responsive view switch and independently scrollable GIS audit table |

These changes improve implementation patterns. **They do not constitute formal WCAG conformance or user usability test results**.

## GIS technical foundation

- **CRS:** WGS84 geographic coordinates (EPSG:4326), with public CSEM, Tanjung Emas terminal and Genuk office reference points. An independent BAKO observation station is shown in the analyst audit table, not placed inside the Semarang study map.
- **GIS audit:** four source-grounded rows with coordinates, approximate great-circle distance from CSEM computed using Haversine, source role and a spatial-provenance decision.
- **Layer controls:** CSEM observation station, public geographic landmarks, and three **fictional** scenario markers may be toggled independently in the zero-network SVG context plot.
- **Real reference field data:** six historically measured Tanjung Emas infrastructure sectors from 2005 levelling cited in a 2017 scientific paper. **No authoritative exact sector geometries** are available in the MVP: these sectors deliberately remain in a table instead of invented pins.
- **Multi-GNSS:** real BAKO 2025 observation quality is independently decoded with GeoRinex; it is not the source of historical CSEM displacement or any Semarang asset-level GNSS position result.
- **Spatial relationship:** distance alone cannot validate movement correlation, representativeness, co-location, subsidence at a structure, flood exposure or structural safety.
- **Online map:** optional OSM embed is a user-initiated street-context illustration. The default plot is offline-capable; OSM is not a DEMNAS elevation product or a validated hazard layer.
- **Missing for commercialization:** source-governed parcel/asset geometry, operator-approved asset register and criticality, current representative geodetic observations, DEMNAS/coastline geoprocessing, geodetic error model, and expert-validated inspection policy.

## Reproducible QA

Run `npm run check` to perform Node tests and the isolated `dist/` static build. GitHub Actions' **Browser demo smoke check** uses headless Chromium to exercise both modes, historic research filtering, source data, GIS layer toggles, map provenance rows, keyboard skip link, downloadable JSON and printable A4 PDF. A failure-injection test prevents synthetic substitution when a real CSEM file cannot be loaded.

Screenshot + PDF QA artifacts are attached to successful browser workflow runs on GitHub Actions. The standalone Vercel URL is **not** confirmed until manually deployed and inspected by the owner.

## Pitch positioning

> BARUNA Sentinel helps infrastructure teams move from disparate historical GNSS and field-survey references to a traceable request for the *next credible measurement*. It cannot and does not issue present-day safety verdicts or independently validated inspection priority rankings.

Commercial validation remains future work, not a proven value claim. For the competition, demonstrate **one sector, one source gap, one verification brief**.
