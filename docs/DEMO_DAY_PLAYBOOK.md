# Bhumireka Demo Day Playbook — 19 November 2026

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
