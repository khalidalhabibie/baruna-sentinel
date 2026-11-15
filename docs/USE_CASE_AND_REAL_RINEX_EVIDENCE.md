# Bhumireka 2026 — one specific use case (scope freeze)

## Scope: Semarang–Genuk / Tanjung Emas coastal logistics infrastructure

**User / buyer hypothesis:** an operations and maintenance team responsible for coastal logistics infrastructure (access roads, facility areas, and associated supporting structures) who must plan limited field verification capacity.

**Single job-to-be-done:** "Before scheduling geodetic verification or a coastal infrastructure site inspection, show which area or asset candidate has credible movement evidence, which evidence is insufficient, and why a follow-up should or should not be scheduled."

This is **inspection planning and data-readiness triage**, NOT a structural safety verdict, generalized coastal flooding forecast, or a scientifically validated ranking of real ports and roads.

### Scenario

- Study context: Semarang–Genuk / Tanjung Emas, Indonesia, as in the originally submitted proposal. These are *scenario locations*, not operator contracts or deployments.
- Published 2021–2023 CSMG and CSEM movement figures may be cited as **external research context**, clearly with source/year.
- The locally bundled CSEM 2010–2021 GPS-derived processed station time series demonstrates historic *station-level movement computation*. Its vertical OLS slope is not equivalent to the 2021–2023 PPP research result.
- **Authentic BAKO IGS RINEX** from 1 January 2025 verifies *multi-GNSS observation quality auditing*, using GeoRinex; station BAKO is in Cibinong, not Semarang. This is a separate engineering-capability proof, **not data about Semarang movement**.
- Three illustrative assets are fictional and explicitly labelled. Their exposure/criticality values must not be presented as validated real-world risk.

### Product boundary

1. A GNSS movement series is readable and its station identity, frame, time period, limitations, and provenance are displayed.
2. A genuine RINEX observation file has populated pseudorange in multiple constellations. A report shows GPS-only versus all-constellation availability on the **same 20-minute BAKO epoch set**.
3. An evidence gate refuses to treat independent BAKO observational QC as a validator of historic Semarang displacement.
4. Synthetic asset scenarios demonstrate the **user workflow**, not validated risk rankings.
5. Results and claims are exported with their source and limitations.

### After the competition, if validated by an operator

The path to actual asset-level inspection ranking needs:
- on-asset/co-located monitored GNSS (or other defensible local geodetic measurements);
- representative exposure layers and operator-validated asset criticality;
- operator-approved inspection criteria and spatial association rules;
- statistical/engineering analysis validated by geodesy and asset-management specialists.

We do not imply that generic CORS readings certify a bridge, quay, access road, seawall or warehouse.

## Real RINEX evidence (completed)

GitHub Actions run: https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506

Input original: https://igs.bkg.bund.de/root_ftp/IGS/obs/2025/001/BAKO00IDN_R_20250010000_01D_30S_MO.crx.gz

GeoRinex decoded 3,272,943 compressed bytes and **41 epochs** within 20 minutes on 1 January 2025.

Pseudorange observation systems present: **GPS, GLONASS, Galileo, BeiDou, QZSS, SBAS**.

Within the same window, average satellites with populated pseudorange:
- GPS-only: **8.951 per epoch**
- all systems: **44.634 per epoch**
- added non-GPS observations present: **41/41 epochs**

These are *observational availability metrics*, **not** a quantified positioning accuracy improvement. Raw files remain at their original archival source; the repository includes a compact verified summary at `data/BAKO_IGS_2025-001_20min_qc_summary.json`, and the CI run preserves a detailed JSON artifact.

## What to show in 60 seconds

1. One sentence operational problem: an operator needs credible evidence before scheduling inspection.
2. CSEM station historical movement calculation and limitations.
3. BAKO **authentic** multi-GNSS QC card, six observed systems and GPS-only vs all availability. Clearly distinct geographic source.
4. Evidence provenance and the fact that an unlinked reference station **cannot justify an asset safety conclusion**.
5. Demonstrate export and offline-ready workflow.

## Strict MVP limits

No PPP solution from the BAKO archive. No motion analysis from that archive. No cross-station accuracy comparison. No prediction of structural damage. No operational asset-level ranking until validated local observations and engineering criteria exist.
