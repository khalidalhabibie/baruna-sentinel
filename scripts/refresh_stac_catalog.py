#!/usr/bin/env python3
"""Fail-closed CDSE STAC catalogue updater (metadata only, never deformation).

Usage: python3 scripts/refresh_stac_catalog.py --output data/semarang-monitoring-catalog.json
Requires public network when GitHub Actions runs; offline tests inject a transport.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import sys
from urllib.request import Request, urlopen
from urllib.parse import urlparse

STAC_URL = "https://stac.dataspace.copernicus.eu/v1/search"
AOI = [110.375, -7.025, 110.485, -6.875]
COLLECTIONS = {"sentinel-1-grd": 1, "sentinel-2-l2a": 2}
MAX_PAGES = 8
MAX_SCENES_PER_COLLECTION = 500
MAX_RESPONSE_BYTES = 6 * 1024 * 1024


def valid_ring(coords):
    if not isinstance(coords, list) or not 4 <= len(coords) <= 300:
        raise ValueError("STAC polygon must have 4-300 vertices")
    output = []
    for xy in coords:
        if not isinstance(xy, (list, tuple)) or len(xy) < 2:
            raise ValueError("STAC vertex must have lon/lat")
        lon, lat = xy[:2]
        if not isinstance(lon, (float, int)) or not isinstance(lat, (float, int)) or not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError("Invalid geographic coordinates")
        output.append([round(float(lon), 5), round(float(lat), 5)])
    if output[0] != output[-1]:
        output.append(output[0])
    if len(set(tuple(v) for v in output)) < 3:
        raise ValueError("Degenerate STAC polygon")
    return output


def convert_item(item, sensor):
    if not isinstance(item, dict) or item.get("type") != "Feature":
        raise ValueError("STAC item is not a Feature")
    if item.get("collection") not in COLLECTIONS or COLLECTIONS[item["collection"]] != sensor:
        raise ValueError("STAC collection/sensor mismatch")
    identifier = item.get("id")
    if not isinstance(identifier, str) or not (5 <= len(identifier) <= 200):
        raise ValueError("Missing STAC item identifier")
    props = item.get("properties") or {}
    dt = props.get("datetime") or props.get("start_datetime")
    if not isinstance(dt, str) or len(dt) < 10:
        raise ValueError("Missing STAC date")
    date = dt[:10]
    datetime.fromisoformat(date)  # reject impossible dates
    geom = item.get("geometry") or {}
    if geom.get("type") != "Polygon":
        # Reject rather than silently turning MultiPolygon into a false footprint.
        raise ValueError("Only polygon STAC item footprint supported")
    ring = valid_ring(geom.get("coordinates", [None])[0])
    cloud = props.get("eo:cloud_cover") if sensor == 2 else None
    if cloud is not None:
        if not isinstance(cloud, (int, float)) or not 0 <= cloud <= 100:
            raise ValueError("Invalid cloud percent")
        cloud = round(float(cloud), 4)
    return [sensor, identifier, date, cloud, ring]


def call_stac(url, method, body):
    if urlparse(url).scheme != "https" or urlparse(url).hostname != "stac.dataspace.copernicus.eu":
        raise RuntimeError("Untrusted STAC pagination host")
    serialized = json.dumps(body).encode() if body is not None else None
    req = Request(url, data=serialized, method=method,
                  headers={"Accept": "application/geo+json, application/json", "Content-Type": "application/json", "User-Agent": "BARUNA-Sentinel-monitor/1.0"})
    with urlopen(req, timeout=35) as resp:
        data = resp.read(MAX_RESPONSE_BYTES + 1)
    if len(data) > MAX_RESPONSE_BYTES:
        raise RuntimeError("STAC response too large; refusing partial catalogue")
    return json.loads(data)


def search_collection(collection, begin, end, transport=call_stac):
    request = {"collections": [collection], "bbox": AOI,
               "datetime": f"{begin}T00:00:00Z/{end}T23:59:59Z", "limit": 200}
    url, method, body = STAC_URL, "POST", request
    results = {}
    for page in range(MAX_PAGES):
        data = transport(url, method, body)
        if not isinstance(data, dict) or not isinstance(data.get("features"), list):
            raise RuntimeError("STAC response is not a valid FeatureCollection")
        for item in data["features"]:
            row = convert_item(item, COLLECTIONS[collection])
            if row[1] in results and results[row[1]] != row:
                raise RuntimeError("Contradicting duplicate STAC scene id")
            results[row[1]] = row
            if len(results) > MAX_SCENES_PER_COLLECTION:
                raise RuntimeError("Exceeded safe catalogue cap; refuse truncated publication")
        next_link = next((l for l in data.get("links", []) if isinstance(l, dict) and l.get("rel") == "next"), None)
        if not next_link:
            return sorted(results.values(), key=lambda r: (r[2], r[1]), reverse=True)
        url = next_link.get("href")
        if not isinstance(url, str) or urlparse(url).hostname != "stac.dataspace.copernicus.eu":
            raise RuntimeError("Invalid STAC next pagination link")
        method = next_link.get("method", "GET").upper()
        if method not in {"GET", "POST"}:
            raise RuntimeError("Unsupported STAC pagination method")
        body = next_link.get("body") if method == "POST" else None
        if method == "POST" and not isinstance(body, dict):
            raise RuntimeError("STAC POST pagination missing request body")
    raise RuntimeError("STAC pagination exceeded safe page cap; no partial update")


def make_catalog(now, days, transport=call_stac):
    if days < 7 or days > 180:
        raise ValueError("Window must be 7-180 days")
    if now.tzinfo is None:
        raise ValueError("UTC timestamp required")
    start = (now - timedelta(days=days)).date().isoformat()
    end = now.date().isoformat()
    scenes = []
    counts = {}
    for collection in COLLECTIONS:
        items = search_collection(collection, start, end, transport)
        # A catalogue with zero observations is inconclusive: do not override a known nonempty source.
        if not items:
            raise RuntimeError(f"No STAC scenes for {collection}; refusing empty publication")
        scenes += items
        counts[collection] = len(items)
    ids = [s[1] for s in scenes]
    if len(ids) != len(set(ids)):
        raise RuntimeError("Duplicate scene ids across collections")
    return {"schema":"baruna-real-scene-index-v1", "sourceMode":"REAL_CATALOG_METADATA_ONLY_NOT_SATELLITE_PIXELS_NOT_INSAR",
            "status":"READY", "source":"Copernicus Data Space STAC public metadata",
            "sourceEndpoint":STAC_URL, "generatedUtc":now.astimezone(timezone.utc).isoformat().replace('+00:00','Z'),
            "queryPeriod":{"start":start,"end":end},"aoiEpsg4326":AOI,"coverageMethod":"STAC_FOOTPRINT_INTERSECTION_NOT_VALID_PIXEL_COVERAGE",
            "count":len(scenes),"counts":counts,"scenes":sorted(scenes,key=lambda r:(r[2],r[1]),reverse=True),
            "limitations":["Sentinel-1 GRD scenes are NOT InSAR SLC pairs or deformation", "Sentinel-2 scenes are NOT flood maps or vertical movements",
                           "Scene intersection does not ensure clear imagery, AOI pixel coverage or operator asset integrity"]}


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",default="data/semarang-monitoring-catalog.json")
    parser.add_argument("--days",type=int,default=90)
    args=parser.parse_args()
    output=Path(args.output)
    catalog=make_catalog(datetime.now(timezone.utc),args.days)
    output.parent.mkdir(parents=True,exist_ok=True)
    # Atomic publication: all collections must pass validation before replacing any file.
    tmp=output.with_suffix(output.suffix+".tmp")
    tmp.write_text(json.dumps(catalog,separators=(",",":"),ensure_ascii=False)+"\n",encoding="utf-8")
    tmp.replace(output)
    print(f"Valid CDSE STAC snapshot: {catalog['count']} scenes ({catalog['counts']}) written to {output}")

if __name__ == "__main__":
    main()