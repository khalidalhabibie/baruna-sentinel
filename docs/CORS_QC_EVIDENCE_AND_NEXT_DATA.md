# BARUNA Sentinel — local Ina-CORS QC and future-data decision record

**Decision date:** 15 November 2026 (Asia/Jakarta).
**Status:** Implemented local-only CSEM / CSMG multi-day QC review. No raw BIG data is placed in this public repository.

## Implemented now

- Decision workspace includes **GNSS Observation Readiness**, with a file picker for a local derived QC JSON.
- Comparison computes epoch coverage, complete/partial/missing station-day files, daily gaps, GNSS pseudorange C1 constellation presence, and shared complete-day counts.
- The browser validates date vs DOY, 2,880 expected daily 30-second epochs, station identity, duplicate dates and numerical bounds.
- The JSON is processed entirely within the current browser tab: no upload request, account access, backend, browser storage or remote data service. **Clear local comparison** resets the view. No SRGI archive is bundled in the public build.
- The map retains three verified public reference points; CSMG RINEX data is **not** treated as a surveyed port asset.

### Local JSON import format

The viewer uses the derived summary format produced privately from the user's RINEX. The following is a *fictional schema example only*, not a released measurement:

    {
      "disposition": "Private diagnostic only; verify BIG permission before sharing",
      "method": "Read-only RINEX2 observation summary; not a position solution",
      "records": [{
        "station": "csem",
        "date": "2026-11-10",
        "doy": 314,
        "epochs": 2880,
        "expected_full_day_30s_epochs": 2880,
        "long_gaps_gt30s": 0,
        "largest_gap_min": 0,
        "first_epoch_gps": "2026-11-10 00:00:00",
        "last_epoch_gps": "2026-11-10 23:59:30",
        "epochs_with_C1_by_constellation": {
          "G": 2880, "R": 2880, "E": 2880, "S": 0, "G+R+E": 2880
        }
      }]
    }

No raw observation or RINEX navigation file belongs in GitHub. Station code in a filename alone is not proof of instrument provenance.

## Scientific limits

1. **Supported:** observation epoch availability, gaps, basic constellation code-pseudorange presence and sample continuity. Full epoch count does not guarantee observation quality.
2. **Not supported:** geodetic height position solution, annual subsidence in mm/year, calibrated horizontal/vertical displacement, structural safety, flood hazard or inspection risk.
3. **Independent datasets:** historical CSEM GPS-derived position time series (2010–2021), recent CSEM RINEX, recent CSMG RINEX, and archived BAKO multi-GNSS QC must never be merged without appropriate station/time/reference-frame linkage.
4. **Unavailable archive:** no file for a station/day means not included in this import, not a confirmed receiver outage. Partial current-day files need not indicate failure.

## Triggers for collecting more data

**P0 — Bhumireka demo now (no extra archive needed):** Show local daily CSEM vs CSMG QC, common dates, evidence gaps, sources and limits. Use only privately imported results and obtain BIG permission before public disclosure. Complete video and pitch before feature expansion.

**P1 — If recurring data-availability monitoring becomes a defined product outcome:** Collect ~30 days at both stations, and introduce batch processing, quality trend / missing-data alerts and ingestion metadata. Add physically meaningful QC (e.g., cycle slips, multipath, code/carrier quality), not just epoch counting. Do not confuse missing archive with receiver malfunction.

**P2 — If testing GPS-only versus combined-GNSS positioning:** Use same-station, same-time observations with matching navigation and appropriate orbit/clock products; independently process GPS-only and multi-GNSS solutions in a consistent reference frame. Compare position residuals, precision, bias, integrity and availability with documented processing assumptions.

**P3 — If claiming long-term subsidence or asset-level inspection priority:** Obtain method-consistent, long-term station position solutions (typically multi-year for reliable seasonal/annual trend estimation), geodetic frame metadata, uncertainty and independent validation. Obtain surveyed port sector geometries, field measurements, asset condition and criticality before any actual rank can be calculated. CORS stations are not measurements on individual infrastructure assets.

## Privacy / publication

SRGI/BIG terms may limit third-party distribution. Keep original ZIP, RINEX observations/navigation and real derived QC on the user's own device until applicable authorization is known. Public GitHub contains only implementation, test assertions and clearly fictional test fixtures. Do not publish station QC screenshots, JSON or ZIPs without verifying permission.

## Current acceptance criteria

- Unit and static build checks pass.
- Browser smoke validates local JSON input, missing days and explicit clear, without changing the map and existing decision flow.
- Desktop and mobile have no unintended horizontal overflow.
- No private RINEX, BIG archives, locally derived results or credentials are committed.
