# BARUNA Sentinel — Ranking & Compare Video Mode
**16 November 2026 · RGPD/BIG Bhumireka · SIMULASI 100%**

## Decision
Add a **connected Ranking & Compare section** to the existing **Spatial Decision Workspace** rather than introducing another dashboard or another screening engine.

The interaction pattern follows the documented Esri Experience Builder selection model: map, list, table and detail all respond to the same selected feature. Relevant references:
- [Esri Table widget](https://doc.arcgis.com/en/experience-builder/latest/configure-widgets/table-widget.htm)
- [Esri List widget](https://doc.arcgis.com/en/experience-builder/latest/configure-widgets/list-widget.htm)
- [Esri Select widget](https://doc.arcgis.com/en/experience-builder/latest/configure-widgets/select-widget.htm)

These are **UX precedents**, not evidence that the prototype's scientific screening policy is validated.

## Data and the ranking policy
**No new fabricated measurement series or second scoring model.** Use the four existing records in `src/assessment.js` (`SYNTHETIC_SCENARIO`) with the existing `assessSyntheticScenario()` and `ASSESSMENT_POLICY`. Display labels and conceptual polygons remain in `src/spatial-scenario.js`.

| Asset (fictional) | Rate input (mm/year) | Motion points | Exposure points | Criticality points | Total demo score | Outcome |
|---|---:|---:|---:|---:|---:|---|
| Sektor A · Akses pelabuhan | -92 | 2 | 2 | 2 | **6** | **01 / HIGH** |
| Sektor B · Jalan pesisir | -44 | 1 | 1 | 2 | **4** | **02 / MEDIUM** |
| Sektor C · Area penyimpanan | -9 | 0 | 1 | 0 | **1** | **03 / MONITOR** |
| Sektor D · Struktur tepi air | -103 (invalid as qualified trend) | — | — | — | **—** | **NOT RANKABLE** |

Policy is `SYNTHETIC_DEMO_POLICY_V1`. It is unvalidated and should never be described as engineering standards, probability of failure, actual port asset risk, or operator-approved inspection orders.

**Evidence gate precedes ranking:**
1. Exact asset geometry and representative site data have to be available in the simulated test.
2. Source/reference frame, adequate observation period/continuity, trend uncertainty, exposure and criticality must pass demo prerequisites.
3. Only records with **zero failed gates and finite scenario score** enter the ranked list.
4. A blocked record has **null rank**, **null score**, and a clear missing-data explanation. The -103 synthetic input must not be ranked first or last.

## User flow in the video
1. Open `/spatial-demo.html`; map and highlighted A show movement, evidence and **High**.
2. Click **Ranking & Compare** in the header description; ranked table shows 01, 02, 03, with D separated as **not rankable**.
3. Pick preset **A vs B** to see why movement, exposure and criticality lead to different scores.
4. Switch to **A vs D · Kualitas bukti**; show that a larger fictional raw movement input does not pass evidence validation. Compare may still inspect the excluded asset.
5. Click a ranked asset to return to the map/details. Its highlight, chart and tier change.
6. Open **Verification Brief**; its content includes eligibility rank or the explicit exclusion.

### Recommended 60-second timeline
| Seconds | Demo | Narrative |
|---|---|---|
| 0–08 | Map + 4 zones | "Pilih aset pesisir dalam simulasi BARUNA." |
| 08–18 | Zone A selected and chart | "Peta, bukti dan hasil bergerak bersama." |
| 18–29 | Jump to ranking list | "Tiga aset layak dibandingkan, satu tidak." |
| 29–42 | A vs B table, then A vs D | "Ranking menjelaskan faktor keputusan; bukti yang belum cukup tidak dipaksa." |
| 42–53 | Click A -> map -> brief | "Keputusan menghasilkan permintaan verifikasi." |
| 53–60 | Clear simulation label and Ourdo logo | "BARUNA Sentinel — dari bukti menuju tindakan." |

## Real data after the recording
The source-backed GIS workflow is intentionally separate. Future integration requires an explicit adapter, **not** renaming `SYNTHETIC` to `REAL`.

### Proposed normalized input contract
- Asset: `asset_id`, name, verified geometry (CRS/coordinate validity), valid date/time and rights.
- Observation: station/sensor ID, original source, time series, unit, reference frame and epoch, height datum, temporal coverage, uncertainty and processing lineage.
- Evidence gate: station-to-asset representativeness, provenance/QA, spatial coverage, continuity, uncertainty, pass/fail reasons.
- Context: verified exposure layer, operator-supplied criticality and rule approval/version.
- Decision: eligibility, versioned assessment and explicit limitations, before any rank.

### Replacement order
1. **Real asset geometry** for actual inspected asset IDs (do not reuse invented demo polygons).
2. **Representative GNSS/levelling series** with methodological and reference frame validation.
3. **Official DEMNAS and other context layers** only after pixel/geometry, datum and quality checks.
4. **Operator thresholds**, exposure, criticality and explicit sign-off.
5. **Separate REAL adapter and re-evaluated method**; revise the policy when scientific assumptions differ. Keep the synthetic showcase available only as an unmistakable tutorial.

**Scientific caveat:** BIG CORS RINEX QC alone is not a position/velocity solution; CSEM/BAKO reference stations are not on-asset measurements; tide forecast is not observed flooding; EGM2008 DEMNAS height cannot simply be overlaid with local MSL tide heights. InSAR remains a separate multitemporal SLC processing project.

## QA release gates
- Map/list/ranking selection stays synchronized.
- Ranking is score-descending among eligible cases; blocked case is excluded.
- Score breakdown reproduces original assessment reasons; no duplicate calculation.
- A/B and A/D presets work, with up to three comparison columns.
- A/D comparison labels invalid raw input, with no approved movement rate or false priority.
- Verification Brief explicitly says SIMULASI, includes rank/blocked status.
- HTML works from `file://` without Vercel, 1440×900 desktop and 390×844 mobile.
- All existing source-backed scientific tests remain green.

**Status:** UI is video-mode first. No production GIS accuracy, survey quality, operator-approved thresholds, commercial willingness to pay or certified risk performance is being claimed.
