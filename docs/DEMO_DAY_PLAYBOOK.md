# Bhumireka Demo Day Playbook — 19 November 2026

## Commercial positioning and evidence-readiness decision demo (15 Nov 2026)

**Positioning:** BARUNA Sentinel is a source-traceable **inspection evidence-readiness workspace** for port and coastal infrastructure operations teams. It does not diagnose asset safety, predict disaster, or promise validated cost savings.

**Buyer / job:** asset integrity or infrastructure maintenance lead, deciding which historical references are useful, what is missing, which site survey must be commissioned, and how to document the decision before scheduling a field inspection.

**Source-backed urgency — do not exaggerate:**
- Raharjo & Yosi (2017) reports 2005 levelling measurements on **six real Tanjung Emas sectors**, including 74–140 cm cumulative historical settlement at West breakwater. These are **not current asset readings**. DOI: https://doi.org/10.32693/bomg.32.1.2017.351
- BMKG's archived November 2026 rob bulletin included **Pesisir Kota Semarang for 1–6 November 2026**. This interval has passed. It is **not an active warning** and **does not measure land movement**. Source: https://maritim.bmkg.go.id/marine2026-data/doc/peringatan-dini-banjir-rob.pdf
- CSEM 2010–2021 historical GPS-derived position series is a different method, station and era from the 2005 field study and BAKO 2025 multi-GNSS observation QC. No integrated local asset displacement solution exists.

**30-second spoken opener, technically honest:**

> Coastal operators have to decide where to verify infrastructure condition, but the evidence is scattered and not always current. This published study records historical settlement at six Tanjung Emas infrastructure sectors. We can reproduce the CSEM station movement series and verify a real multi-GNSS observation file — but those datasets are not an asset safety assessment. BARUNA Sentinel shows exactly what each source proves, flags the missing asset-level baseline, and produces a specific verification brief. The goal is to make the next inspection decision defensible.

**Walkthrough order in app:**
1. Top decision desk: six historically documented sectors, **three independent evidence streams**, **zero current asset-level measurements in this prototype**.
2. Select **West breakwater** in the real field-evidence section; explain that 74–140 cm refers to historical cumulative values, not a rate or present condition.
3. Show CSEM movement and BAKO multi-constellation QC as **separate sources**, including the non-linkage evidence gate.
4. Click **Prepare evidence brief** to show a report naming the selected sector and requesting an updated site survey, asset register, and operator-approved validation.
5. Distinguish the proposed commercial pilot from verified production features. No commercial customer, validation study, actual savings, or performance advantage is claimed.

**Pilot hypothesis (future):** ingest operator-approved asset inventory and new on-site/representative measurements; configure review criteria with geodesy and asset engineers; generate audited evidence reviews. Success metrics to test: percentage of asset reviews with traceable source/provenance, time spent preparing verification requests, and expert-rated action quality. None of these has been measured in the prototype.

**Judge challenge:** “What makes this multi-GNSS instead of a historical port study?”

**Correct reply:** The genuine BAKO RINEX observation QC verifies multiple GNSS constellation observations, but does not yield Semarang movement estimates. The CSEM trajectory is GPS-derived historic positioning. The prototype demonstrates the evidence chain and its limits, not yet a local asset-specific multi-GNSS deformation solution. An operator pilot needs a co-located/local monitoring baseline or scientifically defensible GNSS integration.

---

## Real local sector evidence (historical, NOT current)

A public study by Raharjo & Yosi (2017; levelling measurements in 2005) reports **six real Tanjung Emas infrastructure sectors** with cumulative historical settlement ranges. The visible report cards reproduce their data, identify the method/year and provide the paper source. Their locations are NOT pinned as exact field sites because no authoritative sector survey geometry has been verified.

**Demo sequence, 60 sec:**
- 0–12s: Real operational problem, Semarang/Tanjung Emas context.
- 12–24s: Open *Published Tanjung Emas infrastructure evidence*; pick West breakwater (74–140 cm historic cumulative) and emphasize **2005 data / 2026 status unknown**.
- 24–35s: Show source-grounded WGS84 context; optionally open live OSM, but don't rely on internet.
- 35–45s: Show historical CSEM GPS time series and QC on genuine IGS BAKO RINEX; the sources remain independent.
- 45–55s: Show evidence gate refusing unsafe conclusions; historical sector measurements cannot certify current assets.
- 55–60s: Save concise evidence PDF/JSON. Call to action: field-survey and matched measurement inputs for real inspection prioritization.

The 2017 historical study is **not** a direct GNSS-measured asset-status input and is not evidence of active subsidence today. No false 2026 risk labels. No actual DEMNAS hazard model.

## Fast judge walkthrough — latest independently built static MVP

1. Deploy and open the Vercel URL with `vercel.json` using `npm run build` and `dist/`.
2. Click **Run Semarang case study**. The real historical CSEM and independently checked BAKO QC should reload with a 'Case ready' status.
3. Read the WGS84 context: CSEM / Tanjung Emas / Genuk reference coordinates are source-grounded. Amber A–C asset points are fictitious; this is not an official basemap or DEMNAS raster.
4. Show the actual CSEM station trend and 41-epoch BAKO GNSS availability comparison. **The two datasets are not linked into one displacement solution.**
5. Show the evidence gate and illustrative `VERIFY_LOCAL_EVIDENCE` statuses, then click **Print evidence dossier / Save PDF**.
6. Confirm file/PDF includes independent-source limitations, sample coordinates, declared scenario and sources. Retain one PDF copy as demo fallback.

The browser-based printable dossier is a report capability, not a certified GNSS processing report. A static map/plot is not the missing full geospatial exposure analysis. Prioritize completed video, slides and an onsite-tested deploy before further features.

## Scientific narrative (freeze)

**One specific use case:** A Semarang–Genuk/Tanjung Emas coastal logistics O&M team wants to identify where *field verification* should be planned, and whether geodetic evidence is reliable enough to interpret. It is NOT an engineering-validated asset safety score.

**Two separate authentic sources:**
- CSEM historical GPS-processed station coordinates (2010–2021), for station movement calculation.
- IGS BAKO original multi-GNSS RINEX (1 Jan 2025) from Cibinong, decoded by GeoRinex, for constellation/pseudorange availability QC. Six constellations; 41 epochs; GPS-only 8.951 vs all 44.634 mean satellites with populated pseudorange per epoch. This is **not** positioning-accuracy improvement and is **not** Semarang movement evidence.

The software displays an **INDEPENDENT_SOURCES_NOT_LINKED** provenance gate and never issues operational asset decisions from regional CORS. Three asset scenarios are *fictional*; their scheduling tiers are from fictional metadata only.

## 60-second video outline

- **0–10s:** State problem: coastal infrastructure inspection planning needs documented evidence, not just a subsidence heat map.
- **10–22s:** Show authentic CSEM historic positions, original citation, 2010–2021, 3,561 epochs and descriptive vertical trend.
- **22–37s:** Show real BAKO GeoRinex multi-GNSS QC: 41 epochs, six observed systems, GPS-only vs all observation availability.
- **37–49s:** Show evidence gate visibly refusing to link BAKO QC to CSEM movement. Highlight 'not direct asset movement'.
- **49–57s:** Show *fictional* asset verification workflow, `VERIFY_LOCAL_EVIDENCE` and explanation.
- **57–60s:** Export evidence JSON, close with 'From measurement to a reviewable next step.'

### Optional improvement if organizers provide Semarang RINEX

Request a relevant CSMG or CSEM RINEX via `kerjasama@big.go.id`, subject `Akses data GNSS_BIGBhumireka`. Do NOT wait for this to submit the existing, truthful separate-source demo. A CSEM RINEX file alone does not mean the 2010–2021 position series was processed multi-GNSS.

## Automated checks

- `npm run check` verifies parsing, quality, asset guardrails and evidence gate.
- `Browser demo smoke check` GitHub Actions validates UI, real CSEM source loading, GeoRinex QC summary, browser JSON export and desktop/mobile screenshot.

## Suggested 5-minute deck

1. **Problem (45s).** Differential coastal land movement, limited asset inspection capacity.
2. **Product (60s).** Evidence traceability from measured station positions and asset portfolio context.
3. **Scientific guardrails (75s).** GPS historical movement vs raw multi-GNSS observation inspection, station–asset representativity, missing/weak-evidence handling.
4. **Demonstrable results (75s).** CSEM data processing, conservative action labels and exported audit bundle.
5. **Innovation and roadmap (45s).** Move from regional context to on-site multi-constellation GNSS + authoritative asset register, inspections, QA/QC and escalation policy.

## Likely judges' questions

**Is the historical dataset multi-GNSS?** No proof from the cited processing record. The research states GPS-phase processing. The RINEX inspection is a separate pipeline; no claim of same observations unless verified.

**Why does the CSEM trend differ from proposal figures?** Different observation windows and published processing. The bundled historical dataset covers 2010–2021. The proposal cites another 2021–2023 analysis. Do not compare or reconcile as if they were the same series.

**Do you measure quay movement?** No. The station provides historical regional deformation context. Port/road/storage scenarios are explicitly synthetic. Instrumented-asset assertions require co-located validated sensors.

**Why should anyone pay?** Potential value is reducing unstructured review effort through documented evidence and triage. It is a commercial hypothesis, not yet validated customer demand.

**Is this a production-ready safety model?** No. It is a screening and evidence-workflow prototype with limitations.

## Operational checklist

- [ ] Confirm member Sulthan Bransyah added to official team record
- [x] Original BAKO multi-GNSS archive decoded and QC summary verified (independent from Semarang)
- [ ] Run `npm run check` and browser smoke test
- [ ] Test all buttons, uploads, plot and evidence JSON export
- [ ] Capture 60-second MP4 and 5-minute PDF/PPT presentation
- [ ] Submit by Monday 16 November 2026, 23:59 WIB; set earlier internal cutoff
- [ ] Bring laptop, chargers, adapters, local static build, video fallback and copies of input files
