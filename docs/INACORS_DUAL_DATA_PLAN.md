# BARUNA Sentinel — Two-Lane Ina-CORS Data Strategy
**Prepared 15 November 2026 · submission deadline 16 Nov 23:59 WIB · onsite 19 Nov**

This is an operational runbook, **not** a claim that BIG has already granted a station feed. Protect credentials, source rights, and original raw measurements.

## Decision rule

- **Plan A: official Semarang-local Ina-CORS RINEX**, preferably CSMG if accessible. Attempt access and run local GeoRinex QC. Use the operator-declared station in UI only after reporting what was actually read. Station naming, observation dates and access permissions require validation.
- **Plan B: independent public data already verified.** If official Semarang RINEX is not available or QC fails before presentation freeze, retain the existing BAKO IGS 1 Jan 2025 41-epoch multi-GNSS QC alongside CSEM historical GPS-derived series (2010–2021) and six documented 2005 Tanjung Emas infrastructure sectors.
- **Neither path** computes an asset-level positioning solution, validates subsidence from a short recent window, or automatically grants an operational inspection risk rank.

**Never freeze video/deck on an unreplied access request.** Capture Plan B before switching to Plan A. If Plan A comes after the submission deadline, use it only as an optional onsite update after repeat QA.

## Plan A — official Ina-CORS observations

Source instructions in BIG Bhumireka technical rules: https://bhumireka.com/documents/Ketentuan_RGPD_Hackathon.pdf

1. Register/access https://srgi.big.go.id for available RINEX; check station health via https://nrtk.big.go.id. Determine the *actual* available station and Day Of Year (DOY) instead of assuming CSMG is online.
2. Request access for relevant station/DOY from **kerjasama@big.go.id**, subject **Akses data GNSS_BIGBhumireka**. Request the official 30-second daily RINEX archive first. Do not require 1-second RTCM/NTRIP to complete this demo. Raw data is not public through this repo.
3. If a valid original compressed RINEX file arrives, store it outside the Git repo in a private working directory. Keep archive name, access date, source URL, file checksum, epoch range and format. Decompress ZIP archives yourself if necessary; GeoRinex/Hatanaka supports RINEX/Hatanaka formats, but not every vendor package.
4. Install the existing Python processor:
   `python3 -m pip install "georinex>=1.16,<2" "hatanaka>=2,<3"`
5. Run (replace the file path and station with *verified / officially named* station; not a blind assumption):

```bash
python3 scripts/verify_igs_rinex.py \
  --file /private-data/CSMG_2026319.rnx \
  --station CSMG \
  --source-url https://srgi.big.go.id \
  --minutes 20 \
  --output reports/inacors_local_qc.json
```

   This generates a **user-supplied RINEX QC** report. The CLI explicitly marks the station identity as `operator_declared_unverified`; it is not a certificate by BIG. Review source, filename, epoch window, satellite systems and statistics. A Python script must not silently change this flag to `verified_by_BIG`.
6. Open **GIS / Analyst → Import GeoRinex QC JSON (BIG / local)** and select `reports/inacors_local_qc.json`. The UI displays the station name, epoch count, pseudorange availability comparison, and unverified provenance; the brief and JSON reflect the selected source. **No backend or live API call is required.**
7. Show only what the file actually supports: original observation QC, genuine multiple constellations, number of epochs, and source traceability. Do not infer deformation, positioning accuracy or structural failure.

## Plan B — already validated public data

1. Open the static deployment of BARUNA Sentinel, select **GIS / Analyst**.
2. Click **Restore verified BAKO fallback** (or initial auto-loaded data). It uses `data/BAKO_IGS_2025-001_20min_qc_summary.json`, backed by CI run:
   https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/43690104506
3. State **BAKO (Cibinong) is not Semarang**. GPS-only mean pseudorange satellite count 8.951 vs all observed systems 44.634, on identical 41 epochs; this is **availability, not accuracy**.
4. Complement with **CSEM historic GPS 2010–2021** and **2005 measured Tanjung Emas field sectors**. These are separate observations that do not establish a multi-GNSS deformation solution on the assets.
5. Demonstrate selected real historical port sector → WGS84 context/evidence gap → print evidence dossier. This is a valid, fully offline-ready fallback.

## 60-second talk track if access fails

> Coastal infrastructure inspection decisions need traceable measurement evidence. BARUNA Sentinel uses actual research from six Tanjung Emas infrastructure sectors and a published CSEM station position series. For multi-GNSS we independently downloaded and decoded an original IGS BAKO observation file: multiple constellations appear in real pseudorange records. BAKO is a separate station, so the software correctly refuses to label those observations as Semarang asset displacement. We show the evidence gap and produce a reviewable field-verification request. The next pilot connects a representative local station dataset and operator-approved asset geometries.

## Communications (send yourself; not automatically transmitted)

**WhatsApp:** "Selamat sore, Pak/Bu. Kami tim Ourdo Indonesia, peserta RGPD Bhumireka 2026 kategori Umum. Dalam ketentuan disebutkan akses RINEX Ina-CORS untuk peserta. Untuk studi kasus BARUNA Sentinel Semarang–Genuk, kami ingin meminta arahan ketersediaan data CSMG atau stasiun Semarang terdekat (mis. 12–14 Nov 2026), interval 30 detik. Kami sudah punya pipeline GeoRinex dan ingin menggunakan data lokal untuk uji QC; tidak akan mengklaim tren subsidence dari pengamatan singkat. Apakah cukup melalui SRGI atau ada akses khusus panitia? Terima kasih." 

**Email:** To: **kerjasama@big.go.id**; subject: **Akses data GNSS_BIGBhumireka**. Include team, selected station/DOY, original 30-second RINEX request, query about fallback station and account steps. Requesting access is not the same as receiving it.

## Freeze criteria and risks

- Access not granted / no local archive: **Plan B GO**, freeze verified output.
- File too large, missing pseudorange, wrong period or only one constellation: **Plan B GO**; mark local sample as unusable, do not fabricate.
- Local station identity unknown or no permission to reproduce source: **Plan B GO**.
- Access and valid QC obtained with traceable provenance: **Plan A GO for observation QC only**. Still no verified asset-level GNSS displacement unless a separate method proves it.
- Material deadline **16 Nov 2026, 23:59 WIB**: prioritize complete 1-minute video and 5-minute presentation over extra integrations.
