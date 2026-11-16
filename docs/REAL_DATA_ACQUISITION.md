# BARUNA Spatial — satu repository, satu command

Seluruh kode pengambilan data publik Semarang berada dalam repository
`khalidalhabibie/baruna-sentinel`. **Jangan** menyalin `run.command`,
`recover.command`, atau `recover_missing.py` dari paket ZIP lama.

## Pertama kali di Mac (gunakan ZIP yang sudah Anda unduh)

```bash
git clone https://github.com/khalidalhabibie/baruna-sentinel.git
cd baruna-sentinel
bash acquire.command --import-from /Users/macpro/Code/bhimerka/baruna_mvp_data_fetcher/BARUNA_DATA_REAL.zip
```

Jika repository sudah di-clone, jalankan `git pull` dari folder repo
sebelum command ketiga. Jika ZIP lama berada di lokasi lain, ganti pathnya.
`--import-from` juga menerima direktori `BARUNA_DATA_REAL`.

**Run berikutnya:**

```bash
bash acquire.command
```

Command akan otomatis membuat Python virtual environment, memasang `rasterio`
bila belum ada, memeriksa PDF dan GeoTIFF, menolak DEMNAS palsu/NoData,
mencoba metadata satelit dan OSM, lalu mencoba memotong raster publik yang
tersedia ke AOI Semarang. Semua kegagalan jaringan dilaporkan sebagai gagal
dan **tidak** diganti dengan nilai sintetis.

## Operasi tambahan

```bash
# Audit file lokal saja tanpa menunggu jaringan
bash acquire.command --audit-only

# Cek unduhan PDF, metadata STAC dan OSM, lewati remote raster besar
bash acquire.command --skip-rasters

# Gunakan folder data lokal pilihan (di luar Git juga boleh)
bash acquire.command --data-dir /absolute/path/BARUNA_DATA_REAL
```

## Lokasi output

- `.local/baruna/BARUNA_DATA_REAL/` — direktori data privat lokal (git-ignored)
- `.local/baruna/BARUNA_DATA_REAL/data_manifest.json` — status, asal, SHA256 setiap file
- `.local/baruna/BARUNA_DATA_REAL.zip` — paket ekspor untuk review dan integrasi
- `.local/baruna/BARUNA_DATA_REAL/quarantine/` — file elevasi yang ditolak

**Do not commit the downloaded ZIP, GeoTIFF, raw BIG RINEX, or private QC
files**. `.gitignore` mengecualikan data dan `.venv`.

## Jenis data dan batas interpretasi

| Data | Output | Yang boleh disimpulkan |
|---|---|---|
| BPBD Rob 2025 | PDF resmi | Referensi peta, bukan GeoJSON operasional |
| BIG DEMNAS | GeoTIFF tervalidasi atau quarantine | Elevasi hanya jika piksel/CRS/datum sesuai |
| Copernicus DEM | Potongan DSM GeoTIFF | Ketinggian permukaan, bukan pergerakan tanah |
| Sentinel-2 | Metadata STAC; GeoTIFF optik bila COG bisa diakses | Citra optik, bukan InSAR/deformasi |
| Sentinel-1 GRD | Metadata STAC | Bukan solusi displacement |
| OSM | GeoJSON garis/poligon | Konteks infrastruktur, bukan survey aset |
| CSEM / CSMG RINEX | File QC **lokal terpisah** | Ketersediaan observasi, bukan velocity |

AOI default EPSG:4326: `[110.375, -7.025, 110.485, -6.875]`
(west/south/east/north). AOI ini konteks Semarang, **bukan** poligon
aset Pelabuhan Tanjung Emas.

Output downloader **belum terhubung otomatis** ke workspace keputusan
`spatial-demo.html`. Langkah berikutnya adalah adapter yang menerima data
tervalidasi per sumber beserta CRS/datum/provenance. Laju penurunan
aset, risiko rob, dan prioritas inspeksi nyata tidak dapat dihitung hanya
dari raster/katalog tanpa survei aset dan model ilmiah yang diverifikasi.

Paket telah dikonsolidasikan menjadi satu entry point; keberhasilan akses ke
server provider tetap bergantung pada jaringan dan izin layanan terkait.
