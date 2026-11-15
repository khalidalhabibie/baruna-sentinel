# BARUNA Sentinel — BIG Bhumireka 2026

Independent, offline-capable competition prototype. This repository does **not** import or depend on the existing BARUNA WebGIS application.

## Problem
Coastal infrastructure teams need an explainable **inspection-review queue**, not a misleading map implying that a nearby GNSS station measures every asset.

## Demo (software-only)
1. Load an **explicitly illustrative** observation fixture or a user-supplied cleaned `.rneu` station time series.
2. Validate dates, units, duplicate epochs, completeness, and observation duration.
3. Calculate a **descriptive** vertical displacement trend from parsed positions. No engineering threshold, structural failure probability, or flood prediction is implied.
4. Independently inspect a user-supplied RINEX observation file to identify declared/observed GNSS constellations when supported. A GPS-only time series is **not** evidence of multi-GNSS processing.
5. Compare three **synthetic** asset scenarios using declared importance/exposure and a conservative review-priority rule. Regional observations are never called direct asset movement.
6. Export an evidence JSON bundle with method, provenance, warnings, and known limitations.

## Scientific source
Susilo et al. (2023), [Scientific Data 10, 421](https://doi.org/10.1038/s41597-023-02274-0) and [Zenodo dataset 7775016](https://doi.org/10.5281/zenodo.7775016), containing cleaned `.rneu` and GAGE `.pos` historical data (2010–2021). The paper describes processing **GPS phase observations**. Do not present this dataset as proven multi-constellation data.

## How to run
Pure HTML/CSS/ES modules; no third-party frontend dependencies and no API calls.

```bash
python3 -m http.server 4173
# open http://localhost:4173
node --test
```

The source also supports static hosting on Vercel. The built-in demo fixture is invented for testing and prominently labelled **illustrative / not a real GNSS observation**. Import a verified dataset for a scientifically grounded demo.

## Event readiness
- [ ] Confirm multi-GNSS RINEX from organizers and test constellation parser
- [ ] Import authentic Semarang data and verify a matching station ID and source
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
