# P1 — Private CSEM/CSMG RINEX → verification brief

**16 November 2026 — Ourdo Indonesia / BARUNA Sentinel**

## Workflow

1. Identify authorized CSEM and CSMG **observation** RINEX files covering the same date. Keep raw ZIPs and navigation files on your own machine. Numeric archive IDs do not confirm station identity.
2. Install GeoRinex and NumPy locally: python3 -m pip install georinex numpy
3. Run the offline converter:

    python3 scripts/local_cors_qc.py --csem /private/CSEM-observation.zip --csmg /private/CSMG-observation.zip --output /private/baruna_csem_csmg_qc.json

4. Open **Assessment → Published evidence → P1 / GNSS observation → asset verification**. Import the locally generated QC JSON.
5. Select a documented Tanjung Emas sector and click **Cetak brief dengan lampiran QC lokal**.

The RINEX files are never uploaded, downloaded by the program, or stored in Git. The local JSON is parsed inside the current browser tab; it is not persisted.

## What is calculated

- Actual timestamps and populated C/P code pseudorange cells decoded from locally held observation RINEX.
- Per-day observed 30-second epochs (expected full-day grid: 2,880), long gaps, first/last epochs and observed constellation presence.
- Same-calendar-day CSEM/CSMG pairs and paired full observation days.
- Sector-specific verification requests plus a printable local-QC annex.

This **does not** calculate PPP/RTK coordinates, GNSS positioning precision, displacement, annual subsidence, structural conditions, operational inspection ranking or cost/ROI.

## Fail-closed constraints

- Recognizes ordinary RINEX observation .rnx, .obs or .YYo, optionally gzipped or inside ZIP. Convert Hatanaka .crx / .YYd and Unix .Z to ordinary RINEX locally first.
- Requires actual RINEX header MARKER NAME (CSEM/CSMG) and observation-file type. Do not infer station from a ZIP filename.
- Requires 30-second-aligned observed timestamps; no automatic cadence resampling.
- Rejects duplicate station/dates, invalid observation format, oversized ZIP members, malformed date/DOY and unsafe archive paths.
- The app marks private QC source as **user-declared, NOT BIG-certified**. Instrument metadata, coordinate frame and redistribution rights still require independent verification.
- Source categories remain separate: published 2021–2023 PPP rates, GPS-derived historical CSEM 2010–2021, BAKO 2025 QC and new locally uploaded CSEM–CSMG epoch coverage.
- Even complete station observation records **do not** establish a port asset deformation/priority without site-representative measurements, operator-approved geometry and engineering criteria.

## Actual data status

The previously mentioned uploads BIG_CORS_RINEX_20261115_137.zip and BIG_CORS_RINEX_20261115_411.zip are not present in the accessible current session/filesystem. Their actual station identifiers, observation periods and contents have not been inspected. Neither numeric archive suffix proves CSEM or CSMG.

This iteration tests the workflow on explicitly fictional fixtures. It does not publish any fictitious or invented data as actual BIG observation results.

## Acceptance checks

Node tests verify same-day pairing, missing-station gating, bad DOY, foreign station rejection and printed brief source safety. Python tests verify actual header reading, GZIP, archive handling and path traversal rejection. Browser tests import a labelled fictional JSON, view matching days, print the sector-specific report, reject a wrong station and clear all local session state.

After actual authorized observation ZIPs are available, the next evidence step is running the converter, validating station identities and metadata, and interpreting real QC. Short observation windows alone cannot establish annual subsidence.
