# BARUNA Sentinel — BIG Bhumireka 2026

Independent, offline-capable competition prototype. This repository does **not** import or depend on the existing BARUNA WebGIS application.

## Problem
Coastal infrastructure teams need an explainable **inspection-review queue**, not a misleading map implying that a nearby GNSS station measures every asset.

## Demo (software-only)
1. Auto-load an **authentic historical CSEM GPS-derived series** from a locally bundled source-derived numeric extract (2010–2021), an explicitly illustrative fixture, or a user-supplied cleaned `.rneu` time series.
2. Validate dates, units, duplicate epochs, completeness, and observation duration.
3. Calculate a **descriptive** vertical displacement trend from parsed positions. No engineering threshold, structural failure probability, or flood prediction is implied.
4. Independently inspect a user-supplied RINEX observation file to identify declared/observed GNSS constellations when supported. A GPS-only time series is **not** evidence of multi-GNSS processing.
5. Show three **synthetic** asset scenarios with clearly labelled *illustrative scheduling tiers* derived only from synthetic exposure/criticality. Regional observations only produce `VERIFY_LOCAL_EVIDENCE`, never operational asset inspection priorities.
6. Gate evidence provenance: BAKO authentic RINEX QC does not validate a historical CSEM GPS displacement solution. Export JSON containing gate state, method, sources and limitations.

## Scientific source
Susilo et al. (2023), [Scientific Data 10, 421](https://doi.org/10.1038/s41597-023-02274-0) and [Zenodo dataset 7775016](https://doi.org/10.5281/zenodo.7775016), containing cleaned `.rneu` and GAGE `.pos` historical data (2010–2021). The paper describes processing **GPS phase observations**. Do not present this dataset as proven multi-constellation data.

## How to run
Pure HTML/CSS/ES modules; no third-party frontend dependencies and no API calls.

```bash
python3 -m http.server 4173
# open http://localhost:4173
node --test
```

The source also supports static hosting on Vercel. Automated Chromium desktop/mobile and JSON export checks are provided in `.github/workflows/browser-smoke.yml`. The default bundled CSEM file contains all 3,561 numeric observation rows extracted from the public cleaned Zenodo time series; original header comments were replaced with explicit source attribution. The alternative fixture is invented for UI testing and prominently labelled **illustrative / not a real GNSS observation**. Neither stream is proof of multi-constellation observations.

## Event readiness
- [x] Verify authentic multi-constellation RINEX via GeoRinex (BAKO IGS, independent from CSEM); Semarang-local equivalent remains future work
- [x] Bundle historically processed CSEM Semarang time series with original source citation; verify no implied multi-GNSS solution
- [ ] Complete test and browser smoke check
- [ ] Record 60-second UI demonstration
- [ ] Prepare 5-minute slide deck
- [ ] Submit material to kerjasama@big.go.id by **16 Nov 2026, 23:59 WIB**
- [ ] Confirm amended team member Sulthan Bransyah with organizers

## Explicit limitations
- No raw RINEX positioning solution or RTK processing.
- A RINEX header declaring constellations is not sufficient evidence of actual observation records; the UI distinguishes the two.
- Linear slopes are descriptive estimates, not peer-reviewed geodetic solutions.
- Regional stations are not direct asset instruments.
- Exposures, assets, priorities in demonstration mode are synthetic and not operational advice.
- Neither data source should be silently merged with the other when date, frame, or station provenance differs.

## Verified real multi-GNSS observation QC (15 Nov 2026)

A GitHub Actions run successfully downloaded genuine BAKO IGS RINEX from BKG and decoded the compressed archive using **GeoRinex**:

- Evidence: https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506
- Source: `BAKO00IDN_R_20250010000_01D_30S_MO.crx.gz`, 1 January 2025, IGS station BAKO (Cibinong, Indonesia)
- Measured window: 41 observation epochs in 20 minutes
- Populated pseudorange: GPS, GLONASS, Galileo, BeiDou, QZSS, and SBAS
- Average satellites with usable pseudorange per epoch: GPS only **8.951**, all present systems **44.634**
- 41/41 epochs have observations beyond GPS
- The result is an **observational availability comparison only**, *not* an accuracy or Semarang subsidence comparison

The static UI loads the verified summary from `data/BAKO_IGS_2025-001_20min_qc_summary.json`.
The complete machine-generated QC report is available as a GitHub Actions artifact.
To reproduce processing from the original source:

```bash
python3 -m pip install georinex hatanaka
python3 scripts/verify_igs_rinex.py
```

See [the frozen Semarang use case and scientific limits](docs/USE_CASE_AND_REAL_RINEX_EVIDENCE.md).
