# BARUNA Sentinel — project-centered UI and honest data boundaries

## Purpose

Create a multi-project operational application, not a long one-page competition dashboard. The product helps teams organize evidence around projects, inspect source limitations, and produce traceable follow-up requirements.

## Information architecture

1. **Projects**: list and select workspaces, create explicitly local-only draft records.
2. **Overview**: one selected project with purpose, source records, currently supported interpretations, evidence gaps and next action.
3. **Detail**: for the published Semarang case, one of six historic documented sectors, the original 2005 cumulative measurement, missing present-day asset evidence, and an exportable field-verification brief.
4. **Compare**: select 2–3 workspaces to compare evidence coverage, record periods, geometry availability and current measurements. **Not** a comparison of hazard, movement rate, positioning accuracy or engineering risk.
5. **GNSS Lab**: technical CSEM station-position trend analysis, BAKO archived observation QC, optional local authorized CORS QC.

Distinct URL routes use \`?page=projects|overview|detail|compare|analyst&project=<id>\`. Browser back works, and the current workspace can be selected from the header.

## Demo workspaces

| ID | Type | Actual evidence | Not claimed |
| --- | --- | --- | --- |
| \`semarang-port\` | Research case | 2005 published historical settlement for six sectors | Live deformation, authoritative sector polygons, individual asset safety |
| \`csem-history\` | GNSS reference study | Susilo et al. CSEM archived GPS-derived historical positions, 2010–2021 | Current asset positions, multi-GNSS-derived CSEM solution |
| \`bako-observations\` | GNSS QC reference | Archived IGS BAKO 2025 RINEX pseudorange availability, 41 epochs | Semarang ground movement, position accuracy |
| \`draft-...\` | Browser session placeholder | User-entered title and location only | Server persistence, GIS ingestion, validated engineering assessment |

The three built-in workspaces **are not customer deployments**. They demonstrate how one application can distinguish an operational research case from independent data studies, until true operator projects are available.

## Commercial data model for later implementation

\`\`\`text
Organization
 └── Project (id, name, area, owner, status, access policy)
      ├── Asset (id, authoritative geometry, type, criticality)
      ├── EvidenceSource (source URI, rights, method, time range, frame, uncertainty)
      │    └── EvidenceObservation (asset/station relation, units, quality, provenance)
      ├── Assessment (version, methodology, validation, allowed claims)
      └── VerificationRequest (missing inputs, action owner, priority criteria, report)
\`\`\`

Comparing actual operator projects needs an agreed cohort and comparable evidence/methods, not a visual red/green score. The current comparison is intentionally a **source-readiness matrix**.

## Constraints / not yet implemented

- No authentication, organizations, RBAC, PostGIS persistence, backend audit trail, multi-user collaboration, live monitoring, asset polygon ingestion, or user-generated GNSS processing for local drafts.
- Local project drafts are in browser session storage and may disappear when the session ends.
- "Export verification brief" currently works only for the authentic six-sector Semarang research case.
- The GNSS Lab datasets remain separate scientific references and do not establish an operational structural verdict.

## User review checklist

- Can a new user identify what project they are viewing?
- Can they reach its overview and detail in no more than two navigation actions?
- Can they distinguish historic study, station movement evidence, observation QC and missing data?
- Can they compare data coverage without mistaking it for hazard scores?
- Does a selected Semarang sector still lead to a brief with specific next evidence requests?
- Does the mobile layout remain readable without horizontal overflow?
