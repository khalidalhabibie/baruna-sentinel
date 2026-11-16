#!/usr/bin/env python3
"""Acquire & audit public Semarang geospatial evidence, locally and incrementally.

This is an ACQUISITION tool, not an asset-risk model or an InSAR processor.
The data directory is git-ignored. No private BIG RINEX files are uploaded.
"""
import argparse
import hashlib
import json
import math
import shutil
import sys
import time
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

AOI = [110.375, -7.025, 110.485, -6.875]  # west, south, east, north
PORT = [110.385, -6.985, 110.485, -6.895]
REPO = Path(__file__).resolve().parents[2]
DEFAULT_DATA = REPO / ".local" / "baruna" / "BARUNA_DATA_REAL"
HEADERS = {"User-Agent": "BARUNA-Spatial-Data-Acquisition/1.0", "Accept": "*/*"}
BPBD = [
    ("bpbd_ancaman_rob_2025", "1_PETA%20ANCAMAN%20ROB.pdf"),
    ("bpbd_risiko_rob_2025", "4_PETA%20RISIKO%20ROB.pdf"),
]
STAC = [
    ("Copernicus CDSE", "https://stac.dataspace.copernicus.eu/v1/search",
     {"sentinel2": "sentinel-2-l2a", "sentinel1_grd": "sentinel-1-grd"}),
    ("Earth Search", "https://earth-search.aws.element84.com/v1/search",
     {"sentinel2": "sentinel-2-c1-l2a", "sentinel1_grd": "sentinel-1-grd"}),
]
OVERPASS = [
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
DEM_BUCKETS = [
    ("GLO-30", "https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com", "10"),
    ("GLO-90", "https://copernicus-dem-90m.s3.eu-central-1.amazonaws.com", "30"),
]


def download(url, body=None, content_type=None, timeout=27, limit=20_000_000):
    headers = dict(HEADERS)
    if content_type:
        headers["Content-Type"] = content_type
    request = urllib.request.Request(url, data=body, headers=headers,
                                     method="POST" if body is not None else "GET")
    error = None
    for attempt in range(2):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                buffer = bytearray()
                while True:
                    chunk = response.read(262144)
                    if not chunk:
                        break
                    buffer.extend(chunk)
                    if len(buffer) > limit:
                        raise ValueError("Response exceeds size cap")
                if not buffer:
                    raise ValueError("Empty response")
                return bytes(buffer)
        except (OSError, TimeoutError, ValueError) as exc:
            error = exc
            if attempt == 0:
                time.sleep(1)
    raise RuntimeError(f"{type(error).__name__}: {error}")


def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def entry(manifest, base, name, status, file=None, **extra):
    obj = {"id": name, "status": status, **extra}
    if file and file.is_file():
        obj.update(file=file.relative_to(base).as_posix(), bytes=file.stat().st_size,
                   sha256=sha256(file))
    manifest["datasets"] = [x for x in manifest["datasets"] if x.get("id") != name]
    manifest["datasets"].append(obj)
    print(f"  [{status}] {name}", flush=True)


def import_existing(source, destination):
    source = source.expanduser().resolve()
    if not source.exists():
        raise FileNotFoundError(f"Existing dataset not found: {source}")
    if source.is_dir():
        if source == destination.resolve():
            return
        for path in source.rglob("*"):
            if not path.is_file() or path.is_symlink():
                continue
            relative = path.relative_to(source)
            target = destination / relative
            if not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, target)
    elif source.suffix.lower() == ".zip":
        with zipfile.ZipFile(source) as archive:
            for member in archive.infolist():
                name = Path(member.filename)
                parts = name.parts
                if member.is_dir() or name.is_absolute() or ".." in parts:
                    continue
                if parts and parts[0] == "BARUNA_DATA_REAL":
                    parts = parts[1:]
                if not parts:
                    continue
                target = destination.joinpath(*parts)
                if not target.exists():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(member) as src, target.open("wb") as out:
                        shutil.copyfileobj(src, out)
    else:
        raise ValueError("--import-from must be a dataset directory or .zip")
    print(f"Imported existing local dataset from {source}")


def official_pdfs(manifest, base, audit_only):
    for key, filename in BPBD:
        path = base / "official_reference" / (key + ".pdf")
        url = "https://semarisk.semarangkota.go.id/PETA_PDF/ROB/" + filename
        if path.exists() and path.open("rb").read(5) == b"%PDF-":
            entry(manifest, base, key, "verified_reference_pdf", path,
                  source=url, meaning="Published PDF map; not vector risk polygons")
            continue
        if audit_only:
            entry(manifest, base, key, "missing"); continue
        try:
            blob = download(url, timeout=25, limit=35_000_000)
            if not blob.startswith(b"%PDF-"):
                raise ValueError("Server returned non-PDF data")
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(blob)
            entry(manifest, base, key, "verified_reference_pdf", path,
                  source=url, meaning="Published PDF map; not vector risk polygons")
        except Exception as exc:
            entry(manifest, base, key, "failed", source=url, reason=str(exc))


def validate_demnas(manifest, base):
    import numpy as np
    import rasterio
    original = base / "raster" / "big_demnas_semarang_export_UNVERIFIED.tif"
    quarantine = base / "quarantine" / "big_demnas_semarang_export_REJECTED.tif"
    check = original if original.exists() else quarantine
    if not check.exists():
        entry(manifest, base, "big_demnas_pixel_check", "missing"); return
    try:
        with rasterio.open(check) as src:
            if not src.crs or src.count != 1:
                raise ValueError("CRS missing or unexpected bands")
            data = src.read(1, masked=True)
            values = data.astype("float64").filled(np.nan)
            valid = np.isfinite(values) & (values >= -500) & (values <= 9000)
            valid &= ~np.ma.getmaskarray(data)
            frac = float(valid.mean())
            if frac < 0.05:
                raise ValueError(f"Only {frac:.2%} plausible elevation pixels")
            entry(manifest, base, "big_demnas_pixel_check", "validated_elevation_pixels",
                  check, crs=str(src.crs), pixel_valid_fraction=round(frac, 5),
                  min_m=float(values[valid].min()), max_m=float(values[valid].max()))
    except Exception as exc:
        quarantine.parent.mkdir(parents=True, exist_ok=True)
        if original.exists():
            shutil.move(str(original), str(quarantine))
        entry(manifest, base, "big_demnas_pixel_check", "rejected_invalid_pixels",
              quarantine, reason=str(exc), usable_for_elevation=False)


def stac_search(manifest, base, kind, audit_only):
    target = base / "catalog" / (kind + "_catalog.json")
    if target.is_file():
        try:
            doc = json.loads(target.read_text(encoding="utf-8"))
            features = doc.get("features", [])
            if doc.get("type") == "FeatureCollection" and features:
                entry(manifest, base, kind + "_catalog", "metadata_available", target,
                      count=len(features), meaning="Scene metadata only, not satellite pixels")
                return features
        except (ValueError, OSError):
            pass
    if audit_only:
        entry(manifest, base, kind + "_catalog", "missing"); return []
    window = ("2026-10-01T00:00:00Z/2026-11-16T23:59:59Z" if kind == "sentinel2"
              else "2026-09-01T00:00:00Z/2026-11-16T23:59:59Z")
    for provider, url, collections in STAC:
        body = {"collections": [collections[kind]], "bbox": AOI,
                "datetime": window, "limit": 35}
        try:
            data = download(url, json.dumps(body).encode("utf-8"),
                            "application/json", timeout=25)
            doc = json.loads(data)
            features = doc.get("features")
            if doc.get("type") != "FeatureCollection" or not isinstance(features, list):
                raise ValueError("Invalid STAC FeatureCollection")
            if not features:
                raise ValueError("No scenes in AOI and period")
            doc["baruna_metadata_only"] = True
            doc["source_catalog"] = url
            write_json(target, doc)
            entry(manifest, base, kind + "_catalog", "metadata_available", target,
                  source=url, provider=provider, count=len(features))
            return features
        except Exception as exc:
            print(f"    {provider}: {str(exc)[:180]}", flush=True)
    entry(manifest, base, kind + "_catalog", "failed_all_endpoints")
    return []


def osm_geojson(elements):
    features = []
    for element in elements:
        if element.get("type") != "way" or not element.get("geometry"):
            continue
        points = [[p.get("lon"), p.get("lat")] for p in element["geometry"]]
        if len(points) < 2 or any(None in point for point in points):
            continue
        tags = element.get("tags", {})
        closed = len(points) >= 4 and points[0] == points[-1]
        polygon = closed and any(key in tags for key in ("landuse", "building", "area"))
        geometry = ({"type": "Polygon", "coordinates": [points]} if polygon else
                    {"type": "LineString", "coordinates": points})
        features.append({"type": "Feature", "id": f"osm-way-{element['id']}",
                         "geometry": geometry, "properties": {"osm_id": element["id"], **tags}})
    return {"type": "FeatureCollection", "features": features,
            "source": "OpenStreetMap", "license": "ODbL",
            "limitation": "Context geometry only, not surveyed operator asset polygons"}


def osm_fetch(manifest, base, audit_only):
    target = base / "vector" / "semarang_port_osm_context.geojson"
    if target.exists():
        try:
            features = json.loads(target.read_text())["features"]
            if features:
                entry(manifest, base, "osm_port_context", "vector_available", target,
                      count=len(features), meaning="OSM context, not surveyed port assets")
                return
        except (ValueError, KeyError):
            pass
    if audit_only:
        entry(manifest, base, "osm_port_context", "missing"); return
    w, s, e, n = PORT
    bbox = f"{s},{w},{n},{e}"
    query = ('[out:json][timeout:35];(way["highway"](' + bbox +
             ');way["waterway"](' + bbox +
             ');way["landuse"="industrial"](' + bbox +
             ');way["man_made"~"^(pier|breakwater|quay)$"](' + bbox + '););out tags geom;')
    for url in OVERPASS:
        try:
            body = urllib.parse.urlencode({"data": query}).encode()
            obj = json.loads(download(url, body, "application/x-www-form-urlencoded",
                                      timeout=40, limit=26_000_000))
            geo = osm_geojson(obj.get("elements", []))
            if not geo["features"]:
                raise ValueError("No geometries returned")
            write_json(target, geo)
            entry(manifest, base, "osm_port_context", "vector_available", target,
                  count=len(geo["features"]), source=url)
            return
        except Exception as exc:
            print(f"    OSM {url}: {str(exc)[:150]}", flush=True)
    entry(manifest, base, "osm_port_context", "failed_all_endpoints")


def clip_cog(url, target, min_valid=0.05):
    import numpy as np
    import rasterio
    from rasterio.warp import transform_bounds
    from rasterio.windows import from_bounds
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="YES",
                       CPL_VSIL_CURL_USE_HEAD="NO", GDAL_HTTP_MAX_RETRY="1",
                       GDAL_HTTP_TIMEOUT="22"):
        with rasterio.open(url) as src:
            if not src.crs:
                raise ValueError("COG missing CRS")
            bounds = transform_bounds("EPSG:4326", src.crs, *AOI, densify_pts=7)
            left = max(bounds[0], src.bounds.left)
            bottom = max(bounds[1], src.bounds.bottom)
            right = min(bounds[2], src.bounds.right)
            top = min(bounds[3], src.bounds.top)
            if right <= left or top <= bottom:
                raise ValueError("No intersection with Semarang AOI")
            window = from_bounds(left, bottom, right, top,
                                 transform=src.transform).round_offsets().round_lengths()
            if window.width * window.height * src.count > 22_000_000:
                raise ValueError("Crop exceeds pixel limit")
            data = src.read(window=window, masked=True)
            filled = data.astype("float64").filled(np.nan)
            valid = np.isfinite(filled) & ~np.ma.getmaskarray(data)
            if float(valid.mean()) < min_valid:
                raise ValueError("No adequate valid pixels")
            nodata = (-9999 if src.count == 1 and src.dtypes[0].startswith("float") else 0)
            meta = src.meta.copy()
            meta.update(driver="GTiff", width=data.shape[2], height=data.shape[1],
                        transform=src.window_transform(window), compress="deflate",
                        nodata=nodata)
            target.parent.mkdir(parents=True, exist_ok=True)
            with rasterio.open(target, "w", **meta) as dst:
                dst.write(data.filled(nodata))
                dst.update_tags(source_url=url, source_kind="ACTUAL_PIXELS_NOT_ASSET_RISK")
            return {"crs": str(src.crs), "valid_fraction": round(float(valid.mean()), 5)}


def copdem_fetch(manifest, base, audit_only):
    for tile in ("S07_00_E110_00", "S08_00_E110_00"):
        name = "copdem_" + tile.lower()
        existing = list((base / "raster").glob(name + "_*.tif"))
        if existing:
            entry(manifest, base, name, "raster_available", existing[0],
                  meaning="Surface elevation, not land subsidence")
            continue
        if audit_only:
            entry(manifest, base, name, "missing"); continue
        done = False
        for model, bucket, arcsec in DEM_BUCKETS:
            item = f"Copernicus_DSM_COG_{arcsec}_{tile}_DEM"
            url = f"{bucket}/{item}/{item}.tif"
            target = base / "raster" / f"{name}_{model.lower()}_semarang.tif"
            try:
                meta = clip_cog(url, target)
                entry(manifest, base, name, "validated_surface_raster", target,
                      source=url, model=model, **meta)
                done = True
                break
            except Exception as exc:
                print(f"    {model} {tile}: {str(exc)[:170]}", flush=True)
        if not done:
            entry(manifest, base, name, "failed_all_endpoints")


def sentinel_pixels(manifest, base, features, audit_only):
    target = base / "raster" / "sentinel2_semarang_optical.tif"
    if target.exists():
        entry(manifest, base, "sentinel2_optical", "raster_available", target,
              meaning="Optical imagery, not InSAR")
        return
    if audit_only:
        entry(manifest, base, "sentinel2_optical", "missing"); return
    ordered = sorted(features, key=lambda f: f.get("properties", {}).get("eo:cloud_cover", 999)
                     if isinstance(f.get("properties", {}).get("eo:cloud_cover", 999), (int, float))
                     else 999)
    errors = []
    for item in ordered[:8]:
        assets = item.get("assets", {})
        for key in ("visual", "rendered_preview", "true_color"):
            asset = assets.get(key, {})
            href = asset.get("href") if isinstance(asset, dict) else None
            if not href or not href.startswith("https://") or not href.lower().split("?")[0].endswith((".tif", ".tiff")):
                continue
            try:
                meta = clip_cog(href, target)
                entry(manifest, base, "sentinel2_optical", "validated_optical_raster",
                      target, source=href, scene_id=item.get("id"), **meta)
                return
            except Exception as exc:
                errors.append(str(exc)[:130])
    entry(manifest, base, "sentinel2_optical", "no_accessible_cog",
          reason="; ".join(errors[:3]) or "Metadata available but no accessible visual GeoTIFF asset")


def zip_output(base):
    output = base.parent / "BARUNA_DATA_REAL.zip"
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(base.rglob("*")):
            if path.is_file() and not path.is_symlink():
                archive.write(path, Path("BARUNA_DATA_REAL") / path.relative_to(base))
    return output


def main():
    parser = argparse.ArgumentParser(description="BARUNA Semarang public-data acquisition")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA,
                        help="Where the git-ignored local dataset is stored")
    parser.add_argument("--import-from", type=Path,
                        help="One-time import of existing BARUNA_DATA_REAL directory or ZIP")
    parser.add_argument("--audit-only", action="store_true",
                        help="Offline validation only, no network access")
    parser.add_argument("--skip-rasters", action="store_true",
                        help="Skip Copernicus DEM and optical COG downloads")
    args = parser.parse_args()
    base = args.data_dir.expanduser().resolve()
    base.mkdir(parents=True, exist_ok=True)
    if args.import_from:
        import_existing(args.import_from, base)
    path = base / "data_manifest.json"
    try:
        manifest = json.loads(path.read_text()) if path.exists() else {}
    except (OSError, ValueError):
        manifest = {}
    manifest["datasets"] = manifest.get("datasets", [])
    manifest["aoi_epsg4326"] = AOI
    manifest["data_directory_is_private"] = True
    manifest["scientific_scope"] = "No validated asset deformation, InSAR displacement, or flood risk calculation"
    print("BARUNA Spatial | real-data acquisition", flush=True)
    print("Local dataset:", base)
    official_pdfs(manifest, base, args.audit_only)
    validate_demnas(manifest, base)
    s2 = stac_search(manifest, base, "sentinel2", args.audit_only)
    stac_search(manifest, base, "sentinel1_grd", args.audit_only)
    osm_fetch(manifest, base, args.audit_only)
    if not args.skip_rasters:
        copdem_fetch(manifest, base, args.audit_only)
        sentinel_pixels(manifest, base, s2, args.audit_only)
    manifest["last_audit_utc"] = datetime.now(timezone.utc).isoformat()
    write_json(path, manifest)
    archive = zip_output(base)
    print("Manifest:", path)
    print("Archive:", archive)
    print("Ready datasets:", sum(1 for item in manifest["datasets"]
                                 if item["status"] in ("verified_reference_pdf", "metadata_available",
                                                       "vector_available", "validated_surface_raster",
                                                       "validated_optical_raster", "validated_elevation_pixels",
                                                       "raster_available")))
    print("IMPORTANT: Raw observations and surveyed asset geometry remain separate requirements.")


if __name__ == "__main__":
    main()
