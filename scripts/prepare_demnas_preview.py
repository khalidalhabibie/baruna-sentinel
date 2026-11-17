#!/usr/bin/env python3
"""Prepare a bounded source-derived DEMNAS preview from a locally owned GeoTIFF.

This never downloads anything, never authenticates file provenance and never
converts a vertical DEM into subsidence/flood depth/structural elevation.

Usage:
  python3 -m pip install rasterio numpy
  python3 scripts/prepare_demnas_preview.py \
    --input /private/DEMNAS_original_tile_or_mosaic.tif \
    --output /private/baruna_demnas_preview.json

A single tile may cover only part of the AOI; invalid/outside pixels remain null.
GIS analysts must verify source authenticity, coverage and vertical reference.
"""
from __future__ import annotations
import argparse
from hashlib import sha256
import json
from pathlib import Path
import sys

BBOX = (110.375, -7.025, 110.485, -6.875)
GRID_SIZE = 20
MAX_BYTES = 900_000_000
SCHEMA = "baruna-demnas-local-raster-preview-v1"
SOURCE_MODE = "USER_SUPPLIED_GEOTIFF_DERIVED_NOT_BIG_AUTHENTICATED"


def source_sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def prepare(input_path: Path) -> dict:
    if not input_path.is_file() or input_path.suffix.lower() not in (".tif", ".tiff"):
        raise ValueError("Input must be an existing local GeoTIFF, not an HTML download or arbitrary archive")
    size = input_path.stat().st_size
    if size < 1024 or size > MAX_BYTES:
        raise ValueError("GeoTIFF file size out of the bounded 1KB–900MB range")
    try:
        import numpy as np
        import rasterio
        from rasterio.enums import Resampling
        from rasterio.transform import from_bounds
        from rasterio.warp import reproject
    except ImportError as error:
        raise RuntimeError("Install rasterio and numpy locally: python3 -m pip install rasterio numpy") from error
    with rasterio.open(input_path) as src:
        if src.count < 1 or src.crs is None or src.transform is None:
            raise ValueError("Source GeoTIFF needs a CRS, geotransform and at least one band")
        if src.width < 20 or src.height < 20:
            raise ValueError("Source raster has too few cells")
        destination = np.full((GRID_SIZE, GRID_SIZE), np.nan, dtype=np.float32)
        target_transform = from_bounds(*BBOX, GRID_SIZE, GRID_SIZE)
        reproject(
            source=rasterio.band(src, 1),
            destination=destination,
            src_transform=src.transform,
            src_crs=src.crs,
            src_nodata=src.nodata,
            dst_transform=target_transform,
            dst_crs="EPSG:4326",
            dst_nodata=np.nan,
            resampling=Resampling.nearest,
            init_dest_nodata=True,
        )
        # Reject DEMNAS service sentinel (~1.13427e38), not "0 m".
        valid = np.isfinite(destination) & (destination >= -500) & (destination <= 9000)
        count = int(np.sum(valid))
        if count < 10:
            raise ValueError("Fewer than 10 physically plausible pixels in Semarang AOI; NoData and empty raster rejected")
        values = [
            [round(float(destination[y, x]), 3) if valid[y, x] else None for x in range(GRID_SIZE)]
            for y in range(GRID_SIZE)
        ]
        return {
            "schema": SCHEMA,
            "sourceMode": SOURCE_MODE,
            "fileName": input_path.name,
            "sourceSha256": source_sha256(input_path),
            "sourceDatasetDeclared": "DEMNAS BIG — USER DECLARED, NOT AUTHENTICATED BY BARUNA",
            "officialServiceReference": "https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer",
            "sourceOriginalCrs": str(src.crs),
            "crs": "EPSG:4326",
            "bboxWgs84": list(BBOX),
            "gridSize": [GRID_SIZE, GRID_SIZE],
            "grid": values,
            "validPixelCount": count,
            "sourceNodata": str(src.nodata) if src.nodata is not None else None,
            "originVerifiedByBig": False,
            "canCompareTidalDatum": False,
            "canInferFloodDepth": False,
            "canCalculateSubsidence": False,
            "canRankRealAsset": False,
            "verticalReferenceNote": "Source vertical datum not authenticated or harmonized to tides/levelling",
            "previewMethod": "nearest-neighbour reprojection to 20x20 WGS84 regional preview; NOT original-resolution analytics",
        }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True, help="Authorized local GeoTIFF or previously prepared GeoTIFF mosaic")
    parser.add_argument("--output", type=Path, required=True, help="Local summary JSON to open in BARUNA Pilot Data Lab")
    args = parser.parse_args(argv)
    try:
        result = prepare(args.input)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"DEMNAS local preview prepared: {result['validPixelCount']}/{GRID_SIZE * GRID_SIZE} plausible pixels; not authenticated and NOT a flood/asset-risk calculation.")
        return 0
    except Exception as error:
        print(f"DEMNAS_PREVIEW_REJECTED: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
