# BARUNA Sentinel — AOI Registration, Evidence Monitoring and Inspection Ranking

Status: design decision (not deployed functionality).
Source-of-truth for intended product behavior: `BARUNA_Sentinel_RGPD_2026_READY_TO_SUBMIT.pdf` / proposal asli, sections Summary, 2 Description of Innovation, 3 Methodology, 4 Benefits, 5 Future Potential. This document specifies an implementation trajectory; it is not a validated operational inspection standard.

## Decision
- Navigation: Region > Workspace > AOI > Assets; a region is only a geographic grouping, not the ranking unit.
- Comparison/ranking cohort: `(workspace_id, aoi_id, policy_version, observation_window, evidence_mode)`; NEVER compare uncalibrated scores from different AOIs or time windows.
- Monitoring an AOI means checking for relevant source updates and processing **quality-gated evidence**, not measuring every asset in the AOI or operating a real-time sensor.
- There are two distinct operator work queues: `evidence/verification backlog` and `eligible inspection priority`. Missing evidence is neither low risk nor a zero score.
- The current Semarang research case has zero real assets eligible for operational ranking; retain `DATA_INSUFFICIENT` until asset-location and representativeness criteria are met.

## Baseline (actual code at this decision)
- `src/real-workspace-flow.js`: temporary two-click rectangular AOI; DSM preview screening / separate tide context / export JSON; no persistent AOI registry.
- `src/asset-intake-ui.js`: local GeoJSON asset import, 1–50 Point/Polygon/MultiPolygon features, WGS84 coordinates; records are user-declared and explicitly not certified.
- `src/project-workspace.js`: browser-session-only workspace drafts, not a backend with user accounts or scheduled work.
- `src/assessment.js`: a synthetic-only four-asset ranking; physical thresholds and weights are illustrative, not validated for field use.
- Sentinel-1 discovery exists in `sentinel-helpes`; no validated deformation time series is available in the BARUNA application.

## Registration UX (phase 1)
1. Choose an existing workspace (currently Semarang). Click `Register AOI`.
2. Draw a Polygon on the map, or import GeoJSON (WGS84 longitude/latitude). Two-point bounding boxes may remain a quick-screen option but should not silently become a surveyed polygon.
3. Enter name, purpose (coastal change / deformation / evidence review), geographic owner, source of boundary, optional asset collection and intended observation window.
4. Check CRS, geometry validity, self-intersections, bounding area limits, overlaps/duplicates, and data provenance. Display both boundary source and verification state.
5. Save AOI with `DRAFT`/`REGISTERED_UNVERIFIED` status; a completed real persistent registration requires backend storage, authorization, and an auditable database. Temporary local-only drafts must be explicitly labelled non-persistent and not monitored.
6. Offer `View latest available evidence` and `Export evidence brief`. Do NOT label an AOI `MONITORING` until an ingestion/scheduler pipeline is actually active.

## Evidence monitoring pipeline (phase 2)
AOI registered -> periodic source discovery -> new acquisition notification -> fetch/process -> source+quality validation -> compare with compatible historical baseline -> versioned evidence snapshot -> explanatory alerts / human review.

Separate three levels:
- `CATALOG_WATCH`: new Sentinel-1 SLC / Sentinel-2 L2A acquisitions, dates, coverage, source URLs, completeness. This is a data-availability watcher, not detected subsidence.
- `REGIONAL_CONTEXT`: Sentinel-2 natural color and optical indices, DSM overview, BMKG tide **shown separately** until a defensible common datum and hydrodynamic model exist, plus published GNSS station series/QC. Not proof of structural motion or flooding on an asset.
- `DEFORMATION_EVIDENCE`: quality-controlled Sentinel-1 SLC interferometry/time series (LOS displacement) and/or representative repeat GNSS/levelling observations. Validate relative orbit/burst, baseline, coherence, reference point, atmospheric effects, time span and uncertainties. A single interferogram or regional CORS point cannot automatically give an on-asset vertical velocity. Requires explicit geodetic and spatial representativeness review.

Monitoring frequency is source-dependent. Watch for new acquisitions and process asynchronously; never claim real-time performance from satellite data or from catalog updates.

## Ranking design and safety gate (phase 3)
Proposal-defined dimensions: (1) motion evidence, (2) GNSS/measurement reliability, (3) coastal exposure, (4) asset criticality.

1. `GEOMETRY`: verified asset location/geometry and unique ID, not just an approximate AOI boundary.
2. `PROVENANCE`: source ID, measured quantity, period, unit, CRS/datum/reference frame, operator/source and processing version verified.
3. `REPRESENTATIVENESS`: validated link from measurement (InSAR point/pixel or on-asset benchmark) to particular asset; nearby station alone fails.
4. `QUALITY`: adequate time span, continuity, uncertainty and coherence/precision, with consistent direction and period; avoid cross-sensor mixing without scientific conversion.
5. `CONTEXT`: physical exposure indicator is defensible for the chosen purpose; owner-authorized criticality and policy criteria supplied.
6. `POLICY`: explicit operator/geodetic signoff, versioned weights/thresholds and valid comparison cohort. Fail any hard gate -> `DATA_INSUFFICIENT` and a specific evidence request, not `LOW`.

Only for a qualified cohort: combine movement severity, exposure context, and operational criticality according to an owner-reviewed, calibrated policy. Evidence quality serves as eligibility/cap, not as a way to hide missing evidence with a low numerical risk value. Output: `HIGH`, `MEDIUM`, `MONITOR`, `DATA_INSUFFICIENT`; always show reason codes, underlying source and limitations. It is **inspection-screening priority**, never structural failure probability or certified safety.

### Existing simulation math — NOT the field algorithm
`ASSESSMENT_POLICY` in `src/assessment.js` is labelled `SYNTHETIC_DEMO_POLICY_V1`. If synthetic fields pass gates (minimum 1 year, at least 80% continuity, slope uncertainty <=25 mm/year, source/geometry/representativeness/context checks), its illustrative score is:

```
movement_points = downward_rate >= 80 ? 2 : downward_rate >= 30 ? 1 : 0
exposure_points = high:2, moderate:1, low:0
criticality_points = high:2, moderate:1, low:0
score = movement_points + exposure_points + criticality_points
simulated_tier = score >= 5 ? HIGH : score >= 3 ? MEDIUM : MONITOR
if any gate fails: DATA_INSUFFICIENT; score = null
```

These numerical thresholds, weights, and point values have no calibration in the original proposal and MUST NOT be used for real port decisions without data, expert review and an operator-approved standard.

### Two separate priority surfaces
- `Verification queue`: who must supply geometry, benchmark, latest inspection, exposure and criticality context; group by responsible owner and evidence gap. Do not call this a measured safety ranking.
- `Inspection priority`: **only eligible, comparable assets in the same registered AOI** can get a ranked tier, with an exportable evidence trail.

## Proposed persisted entities
- `region(id,name)`
- `workspace(id,region_id,owner_id,purpose,status)`
- `aoi(id,workspace_id,name,geometry_4326,geom_source,verified,area_km2,status,created_at)`
- `asset(id,aoi_id,geometry_4326,criticality_declared,criticality_approved,geometry_verified)`
- `evidence(id,aoi_id,asset_id_nullable,sensor,product,period_start,period_end,quantity,unit,crs,datum,reference,quality,representativeness,source_uri,checksum,processing_version)`
- `monitoring_run(id,aoi_id,source_kind,started_at,ended_at,scan_status,processing_status,error,output_evidence_id)`
- `assessment(id,aoi_id,asset_id,policy_version,cohort_window,eligibility,score_nullable,tier,reason_codes,evidence_snapshot_id,review_status)`

## Pilot acceptance criteria
- User can name/save/reopen an AOI across sessions with audit log once backend is delivered.
- User sees last catalog check, last accepted observation, missing observation status and provenance separately.
- No monitoring claim if scheduling disabled; no displacement claim from GRD catalog or Sentinel-2 True Color.
- No asset ranks appear for the six real Tanjung Emas historic sectors until verified current on-asset evidence and geometry exist.
- A synthetic demo remains explicitly isolated and cannot be promoted to production asset output by editing client-side metadata.
- A reviewer can trace every eligible score to a policy version and immutable observation snapshot.

## Alignment with original RGPD proposal
- Methodology #1 `Data dan kendali mutu` -> ingestion, QC, provenance and station availability checks.
- #2 `Estimasi pergerakan` -> repeat GNSS / InSAR time series with uncertainty (not just scene discovery).
- #3 `Keandalan dan cakupan bukti` -> hard eligibility/capping gates.
- #4 `Konteks spasial dan aset` -> registered AOI, verified asset geometry, source linkage and exposure context.
- #5 `Prioritas dan penjelasan` -> evidence-gated tiers, reproducible reasoning and verification brief.
- `Future Potential` -> progresses from regional evidence to on-asset monitoring with dedicated benchmarks, verified asset registers and optional InSAR integration; it does NOT promise full asset monitoring in the 2026 prototype.

External technical reading: https://hyp3-docs.asf.alaska.edu/guides/insar_product_guide/ and https://sentiwiki.copernicus.eu/web/s1-applications.
