# BARUNA Sentinel — User Journey & GIS Reviewer Guide

**Ourdo Indonesia · 16 November 2026 · Proposal-aligned prototype**

## One-sentence product definition
**BARUNA Sentinel helps coastal infrastructure teams decide what evidence must be verified before setting an inspection priority.** It is not a generic web GIS layer catalogue or a structural-safety certification platform.

## Who it's for
- **Infrastructure / asset operations:** inspect the right locations with reasons, prerequisites, and a printable verification brief.
- **GIS and survey professionals:** examine provenance, spatial coverage, site association, measurement date, uncertainty, and missing geometry.
- **Geodesy / GNSS specialists:** audit station history and multi-GNSS observation quality independently; avoid extrapolating station results to an asset.

## The actual product walkthrough
1. **Beranda — understand the problem.** What can we know about a selected coastal asset? Start with Tanjung Emas, not GIS layer settings.
2. **Studi kasus → Cek bukti — choose the location.** Example: West Breakwater. Published **historical 2005 cumulative settlement: 74–140 cm**. Not today's movement, an annual velocity, nor a current safety status.
3. **Review the evidence gate.** Published field research and independent GNSS reference sources exist. Exact surveyed sector geometry, on-asset current survey, and reviewed operational decision rules do **not**.
4. **Outcome: DATA INSUFFICIENT.** This is a valid and useful *decision-readiness* result. It prevents unjustified HIGH/MEDIUM risk ranking and lists what to obtain before field decisions.
5. **Data GNSS (optional deep dive).** CSEM 2010–2021 station position history is different from BAKO 2025 multi-GNSS QC; neither is current West Breakwater deformation. Synthetic ENU visualizations are confined to the separate video route.
6. **Export assessment brief.** Save/print the report with provenance, historical evidence, missing measurements, and required field actions.

## Where each data provider fits
| Source | Role | What it does NOT prove |
|---|---|---|
| Historical Tanjung Emas 2005 study | Asset/sector historical context | No asset condition in 2026 |
| CSEM station position history (2010–2021) | Regional/station GNSS motion context | No movement of West Breakwater |
| BAKO RINEX QC (2025) | Multi-GNSS observation availability | No Semarang subsidence or accuracy gain |
| BMKG Semarang Nov 2026 | Source-backed **tide forecast** on the separate video route | Not observed rob, flooding or asset safety |
| DEMNAS | Potential regional elevation context; video mock while pixels unvalidated | No engineering settlement measurement |
| Sentinel-2 L2A | Candidate imagery *catalogue metadata* in video route | Not InSAR displacement or asset hazard |
| Sentinel-1 InSAR | **Future optional integration** using registered multitemporal SLC phase measurements | Not in this prototype |
| Operator geometry/survey | Missing prerequisite for authoritative asset-specific priority | Fictional sectors cannot substitute |

## Proposal boundaries and decision gates
The submitted BIG Bhumireka RGPD proposal describes multi-GNSS → movement evidence → reliability → exposure & asset criticality → explainable inspection priority. Current real data **cannot** complete operational ranking because exact asset-level linkage and survey have not been validated. Therefore the functional prototype demonstrates the evidence gate and **verification brief**, with any HIGH/MEDIUM/MONITOR ranking strictly synthetic and isolated.

**Use in a pitch:** "Bukti regional tidak selalu cukup untuk menentukan kondisi sebuah aset. BARUNA menjelaskan apa yang sudah diketahui, apa yang belum, dan apa yang perlu diverifikasi sebelum menetapkan prioritas inspeksi."

## First-time onboarding
- Small 5-stage anchored product guide opens on first arrival at the home screen, without full-screen interruption.
- Guides through problem → site → evidence gate → independent GNSS sources → action/report.
- Users can close/skip, navigate directly, or reopen using **Panduan 2 menit** in the header.
- Guide completion stored only in browser localStorage; no credentials or field data stored.
- All advanced features remain accessible from **Eksplorasi lainnya**.

## 60-second screen recording order
**0–8 s** Beranda problem and example West Breakwater;
**8–23 s** Cek bukti and historical 2005 data;
**23–34 s** DATA INSUFFICIENT + missing measurements;
**34–44 s** Data GNSS independent sources;
**44–55 s** return to Cek bukti and print/report;
**55–60 s** verification brief and Ourdo / BARUNA title.

For production: close the first-use guide after showing its first screen; do not let it cover the assessment result. Verify desktop at 1366×768 and 1920×1080, laptop/TV contrast, responsive nav, keyboard focus, and offline build. The submitted presentation and one-minute video are separate artifacts.

## Success criterion for a non-technical first-time reviewer
Within **30 seconds** the reviewer can answer:
1. *What is the product for?* Evidence-gated coastal infrastructure verification.
2. *What did we learn from the example?* Historical 2005 settlement exists; current asset assessment is unavailable.
3. *What action should we take?* Confirm geometry, update on-asset measurements, and get specialist/operator review; export a brief.

**References:** Original RGPD 2026 BARUNA Sentinel proposal; Ourdo BARUNA video production brief; public studies referenced in app. Current code and data claim gates in repository are authoritative for what the demo actually computes.
