# BARUNA Sentinel — Integration of actual available BIG SRGI evidence

Updated 16 November 2026. Evidence available during development was provided as private user archives and BIG SRGI page captures. This document records integration **without publishing user-supplied RINEX, derived observations, account-specific URLs or raw PDFs.**

## Existing public references in Assessment

1. **CSEM station site profile** — BIG SRGI (https://srgi.big.go.id/cors/CSEM); site log prepared 2022-04-15. First installation 2010-01-13; Leica GR50 receiver recorded as installed 2018-08-02. The earlier receiver/antenna history matters for any long-term comparison.
2. **CSMG station site profile** — BIG SRGI (https://srgi.big.go.id/cors/CSMG); site log prepared 2022-01-28. Installation 2021-11-30; Leica GR50. Approximate position was blank in the site-log capture; no coordinate is inferred.
3. **2005 Tanjung Emas historical field study** — published research; historic measurements are not current asset condition.
4. **CSEM historic station positions 2010–2021** — already sourced and displayed in the separate GNSS evidence flow.
5. **BAKO QC from IGS 2025** — independently derived observed multi-GNSS signal availability, *not* a CSEM or CSMG position solution.
6. **Published 2021–2023 CSEM/CSMG PPP rates** — independently published in Sitaningrum & Widjajanti (2024), not to be merged with any locally processed 2026 RINEX availability statistic.

## Actual 2026 private QC — safe operator workflow

Available, authorized local user archives cover approximately **2026-10-17 through 2026-11-15 (DOY 290–319)**. ZIPs have 30 CSEM observation days and 29 CSMG observation days, with GPS navigation pairs; CSMG DOY 317 is absent **from the downloaded archive**. This is a statement about archive contents, not receiver uptime.

The operator should use the **private derived JSON generated from the archives** (schema: baruna-private-cors-qc-v1) instead of uploading raw ZIPs to the web app:

1. Open BARUNA Sentinel, choose **Assessment → Published evidence** for the Tanjung Emas case.
2. Review the **Data tersedia / Data masih menunggu** section; station site-log references are public context, while the 2026 QC slot shows **MENUNGGU IMPOR**.
3. Select **Pilih JSON QC lokal** and choose the original private summary file. The app processes it within current browser memory only; there is no server upload, browser storage or network transmission from the file input.
4. The app computes real imported archive epoch coverage (including missing archive days), same-date station pairs, full 30-second days and missing file dates. It also shows a per-date QC drilldown.
5. Select a historical sector and **Cetak brief dengan lampiran QC lokal**. The output explicitly states no 2026 station-to-asset displacement solution, current site measurement or operational asset risk was computed.
6. **Hapus dari sesi** to clear the private imported QC from memory.

**Expected cross-check on the user's private 2026 JSON** (not bundled): 30 CSEM station-days, 29 CSMG station-days; 29 same-date pairs and 21 full-grid pairs; 30-day epoch coverage around 99.17% (CSEM) and 88.96% (CSMG); CSMG archive record absent for 2026-11-13. These are archive timestamp availability metrics, NOT verified geodetic accuracy, receiver uptime or 2026 subsidence.

## Data placeholders deliberately left empty

- **Official CSEM & CSMG numeric time series (post-2022):** missing. We only have portal PDF captures of historical graph displays and public 2021–2023 published PPP rates, not daily coordinate values. The UI leaves velocity, official coordinate datum and uncertainty NULL; it displays **MENUNGGU DATA**, not zero. No import parser is activated until official numeric format/provenance is inspected.
- **Asset geometry and site-representative movement:** missing. No surveyed port boundary/asset ID/current onsite measurements or operator-approved exposure/criticality gates. Asset risk remains **DATA INSUFFICIENT** even if both GNSS stations have 100% archive epoch coverage.

## Publication and scope

Public code may list station metadata and source URLs and implement the import pipeline. The user's downloaded BIG ZIPs, their locally derived private QC JSON and scanned source captures are **not** committed to the public repo. Derived QC is imported in-browser only at the user's instruction and should not be exported publicly without checking BIG permission/licensing.

The print feature is for internal validation and source-gated evidence requests, not safety certification. Numeric time-series integration is a separate future task once real files and coordinate frame/epoch metadata exist.
