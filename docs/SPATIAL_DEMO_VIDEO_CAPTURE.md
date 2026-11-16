# BARUNA Sentinel / Spatial Decision Demo — Video Bhumireka 2026

**Mode:** isolated, entirely **SYNTHETIC** GIS showcase  
**Route:** `/spatial-demo.html`  
**Integration:** no changes to the source-backed Assessment scoring; the model is imported from `src/assessment.js`.  
**Not for:** actual inspections, asset safety, subsidence monitoring, flood prediction, GIS surveys.

## The single product story (no jargon required)

"Ketika suatu aset pesisir dipilih, BARUNA memperlihatkan lokasinya, contoh pergerakan dan kelengkapan bukti, menjelaskan hasil screening, lalu menyiapkan Verification Brief. Seluruh angka pada mode ini adalah simulasi untuk menunjukkan alur. Penilaian nyata membutuhkan geometri dan pengukuran yang tervalidasi."

### Four deliberately fictional cases

| Video asset | Rate input | Exposure | Criticality | Demo result |
| --- | ---: | --- | --- | --- |
| Sektor A — Akses pelabuhan | −92 mm/year | High | High | HIGH |
| Sektor B — Jalan pesisir | −44 mm/year | Moderate | High | MEDIUM |
| Sektor C — Area penyimpanan | −9 mm/year | Moderate | Low | MONITOR |
| Sektor D — Struktur tepi air | −103 mm/year, **not a qualified trend** | High | High | BLOCKED / DATA INSUFFICIENT |

The policy thresholds and quality gates are **prototype numbers**, not engineering standards. The demo reuses `ASSESSMENT_POLICY` and `assessSyntheticScenario()` with no separate scoring formula. The fourth case deliberately fails geometry, representative measurement, short coverage, continuity and uncertainty gates: it **cannot** turn into a HIGH result just because it has a numeric rate input.

The four colored polygons are **fabricated illustrative shapes in the Semarang region**, not surveyed polygons or the actual sites from the 2005 publication. Basemap is OpenStreetMap where online; a clearly decorative geographic illustration remains if tiles cannot load.

## 60-second video guide for editor

| Time | Screenshot / action | Spoken point |
| --- | --- | --- |
| 00–06 s | Title BARUNA, map with four colored polygons, permanent simulation banner | "Data geospasial bisa membantu memutuskan aset yang perlu ditinjau lebih dahulu." |
| 06–17 s | Click Sektor A polygon, selected geometry highlights, movement chart and **Prioritas tinggi** appear | "Pilih aset. Pergerakan, paparan, dan kekritisan dipakai bersama dalam satu policy yang transparan." |
| 17–29 s | Click Sektor B, then Sektor C; results change HIGH → MEDIUM → MONITOR | "Setiap aset memiliki alasan keputusan, bukan sekadar warna di peta." |
| 29–44 s | Click Sektor D; trend becomes **Tidak valid**, results **Bukti belum cukup**, reasons list | "Jika bukti belum layak, BARUNA tidak memaksakan hasil prioritas." |
| 44–56 s | Return to A; click **Lihat Verification Brief**; demonstrate report source/limits/actions | "Outputnya adalah brief verifikasi yang bisa diperiksa tim." |
| 56–60 s | Close brief, show brand and permanent banner | "BARUNA Sentinel — dari bukti menuju tindakan yang bisa dijelaskan." |

**Always show or mention:** all four zones, coordinates, motion rates, context and priority tiers are made up for video. Do not narrate them as findings from BIG or Tanjung Emas operator.

## How to review in browser

1. Run `npm install` and `npm run build`.
2. Run `python3 -m http.server 4173 -d dist`.
3. Visit `http://localhost:4173/spatial-demo.html`.
4. Pick any asset in the left list or click a polygon; the map, trend and reasons update.
5. Click `Lihat Verification Brief`, print or download the text.
6. Visit `/?page=assessment` to see a **different, source-backed** research review, which is intentionally not ranked.

## What is real versus simulated?

The entire `/spatial-demo.html` route is **synthetic**. The real data elsewhere in the repository remain untouched: CSEM historical position records, independent BAKO QC, 2005 Tanjung Emas field study and the BMKG Semarang tide forecast in the older storyboard route. This demo does not merge them into fictional asset scores.

## After the video: replace only verified data providers

- **Step 1:** obtain authoritative operator asset geometry, CRS, timestamps and survey rights; don't treat these demo polygons as a template for real sites.
- **Step 2:** obtain representative multi-epoch GNSS/levelling data with reference frame, datum, uncertainty, quality and source metadata. Satellite InSAR requires its own validated processing.
- **Step 3:** validate context and operator-agreed criticality and priority thresholds; re-evaluate the scoring policy.
- **Step 4:** implement a new **source-backed data adapter** feeding compatible UI schemas. Preserve provenance per record and rework methods when official data cannot meet the same assumptions.
- **Step 5:** keep demo mode isolated and branded **SIMULATION**. Never simply rename the demo fixture to REAL.

## Quality gates before sending to video editor

- Every polygon is selectable, visibly highlights and updates the detail + chart + reasons.
- Four outcomes differ and the blocked asset never shows a qualified movement chart.
- Report matches the selected asset and repeats simulation warning.
- Desktop 1440×900 and mobile 390×844 are free of overflow.
- Header includes real Ourdo wordmark with its O tail.
- A saved local static build works even when OSM tiles aren't available (fallback schematic remains; GIS shapes and controls should still render).
- No real GNSS or official hazard source is presented as evidence for the fictional ranking.

**Do not tell judges this demonstration computes actual Semarang infrastructure priorities.** It demonstrates interaction and rules; the scientific source-backed review is separate.
