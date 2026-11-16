# BARUNA Sentinel — Video-ready UX Freeze / 16 Nov 2026

## Release intent
Finish the current hackathon story, not add features. The UI connects:
1. **Decision Demo / 4 illustrative assets:** `/spatial-demo.html`
2. **Evidence Review / 6 real historical research sectors:** `/?page=assessment`
3. **GNSS reference review:** `/?page=analyst`

**These are different source populations. Do not relabel the four simulated polygons as the six surveyed sectors.** The research workflow cannot establish current asset-level inspection ranks.

## What was improved
- Source distinction is visible above the four-asset map, in the decision-demo navigation, and from the six-sector Workspace.
- The map has a direct **Lihat 3 prioritas ↘** action. Ranking has a direct **← Kembali ke peta** link.
- The selected asset remains consistent across the polygon, list, movement chart, eligibility rank, compare and Verification Brief.
- **Laju vertikal** is a rate, expressed in **mm/tahun**; the trend chart is **perpindahan vertikal relatif dalam mm**, with the first synthetic observation normalized to zero. No inspection ranks or scoring thresholds changed.
- Raw quality-gate codes were replaced with readable reasons in Compare (for example, geometry and data continuity).
- Browser CI tests cover desktop, mobile, map ↔ ranking, 4-vs-6 data distinction, blocked asset, report export and direct `file://` standalone playback.

## 60-second video shot plan
| Time | Screen and operator action | Message |
| --- | --- | --- |
| 00–08 | Decision Demo, show full map with 4 illustrations | “Ada empat aset contoh di peta BARUNA.” |
| 08–19 | Click A; point to rate (mm/tahun), chart (mm) and decision | “Data, kualitas bukti dan prioritas dapat diperiksa bersama.” |
| 19–30 | Click **Lihat 3 prioritas ↘**; show ordered A/B/C and D unranked | “Prioritas didasarkan pada bukti yang memenuhi syarat.” |
| 30–43 | Click **A vs D · Kualitas bukti**; show actual missing-evidence reasons | “Angka pergerakan besar saja tidak cukup jika pengukurannya tidak layak.” |
| 43–54 | Click A in ranking, then open Verification Brief | “Outputnya adalah tindak lanjut yang punya alasan dan batas penggunaan.” |
| 54–60 | Show Demo Scenario banner and Ourdo brand | “BARUNA Sentinel — peta, bukti, lalu keputusan.” |

### Five-minute spoken demo / backup if the judge asks
- Start on `/?page=why` for **six historical sectors from the 2005 field study**. Distinguish **published cumulative settlement in centimetres** from annual velocity in millimetres per year.
- Open `/?page=assessment` and show the research workflow correctly refuses a current operational rank because site geometry and modern on-asset measurements are missing.
- Open **Decision Demo** from header to illustrate the intended complete product interaction with **four separate synthetic assets**; show A/B/C ranking, D blocked, Compare and Brief.
- If challenged about GNSS, open `/?page=analyst` and explain independently sourced historical CSEM positions and BAKO observation QC. No direct station-to-asset displacement is inferred.

## Acceptance checklist before screen recording
- [ ] Site `/spatial-demo.html` shows the Demo Scenario banner and 4 assets.
- [ ] Map → Lihat 3 prioritas → Ranking → Kembali ke peta works without a dead route.
- [ ] A ranked 1; B ranked 2; C ranked 3; D **not ranked**.
- [ ] A vs D Compare explains missing quality criteria **in Indonesian**.
- [ ] Rate uses mm/tahun; chart uses relative mm; invalid D has no qualified movement curve.
- [ ] Verification Brief contains source caveat and selected asset.
- [ ] Evidence Review explicitly shows **six research sectors**, not the four demo assets.
- [ ] Browser and scientific CI tests pass at merged commit.
- [ ] Production deployment of the merged commit is inspected separately. A GitHub-green commit does not prove production has updated.

## After video: no shortcuts
Replace demo data only through source-backed adapters with valid asset boundaries, CRS, representative measurements, datum, uncertainty and authorized operator policy. Keep quality gate strict. **Do not manufacture official GPS/GNSS output or claim the demonstration prioritizes real Tanjung Emas assets.**

**Scope freeze:** do not add new dashboards, InSAR processing, DEMNAS overlays, geospatial layer uploads, new scientific scores, or backend infrastructure before submission.
