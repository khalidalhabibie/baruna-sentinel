# BARUNA Sentinel — Region directory and ranking scope

Decision: the homepage has a region directory, while operational ranking (when evidence permits) is **within a single validated area of interest (AOI)**, not a nationwide or cross-city league table.

## What is shipped in this iteration
- `index.html` and `workspaces.html` show one active region: **Semarang Coastal**. Jakarta Coastal and Surabaya Coastal are visually marked placeholders with no anchor, button, fabricated measurement, or ranking.
- The four existing cards on `workspaces.html` are **analysis modules within Semarang** (real spatial evidence, historical research, illustrative scenario, GNSS reference), not four independent geographic workspaces.
- `spatial-demo.html` still ranks **four fictional assets** only. This simulation is never blended with historical source evidence.
- Existing Semarang navigation, map, reports, and lab routes remain intact. This change is UI/information architecture, **not** a new multi-region backend or ranking engine.

## Product hierarchy (future data contract)

```
Region (Semarang / Jakarta / ...)
  └── Workspace (project / operational tenant / coastal program)
        └── AOI (specific inspected district/port/asset cluster)
              └── Asset (surveyed geometry and linked observations)
```

The region is a geographic navigation/grouping concept. A workspace is a bounded project with owner, purpose, data access, and methodology. One city could have multiple workspaces or AOIs.

A ranking cohort must be explicitly scoped to:
`workspace_id + aoi_id + assessment_policy_version + evidence_mode + comparison_period`.

## Evidence gates before a REAL ranking

1. Comparable, verified asset geometries and stable IDs within the AOI.
2. Source records attributable to those exact assets, with dates and physical measurement definitions.
3. Comparable methods, uncertainty, time windows, datum/CRS and indicator direction.
4. Eligibility checks and a documented, owner-reviewed ranking policy, thresholds, weights and uncertainty display.
5. A reproducible evidence dossier for every scored asset. Missing evidence -> `DATA_INSUFFICIENT`, not rank 0/low risk.

For Tanjung Emas, the six published 2005 sectors currently lack independently verified exact geometry and recent on-asset measurements. Consequently **no operational ranking is permitted**. The historical 2005 ranges must not be interpreted as 2026 annual subsidence rates.

## Later, not in this release
- A project data store supporting regions/workspaces/AOIs/assets and access control.
- Data onboarding, evidence checks and an independently reviewed ranking policy for real measured assets.
- Aggregated cross-AOI reports with normalized comparable indicators, never naive ranking by city.

The JavaScript scenario ranking remains demo-only until an explicitly separate real-world model is validated.
