#!/usr/bin/env python3
"""BARUNA: read-only continuity QA from ONE original HyP3 interferogram.

No LOS displacement, annual vertical trend, independent phase-unwrapping
verification or asset-risk estimates are generated. Requires numpy,
rasterio and scipy. Never commit private source TIFFs.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import transform_geom
from scipy.ndimage import label

PRODUCT = "S1_162214_IW2_20261002_20261014_VV_INT80_5087"
AOIS = (
    ("aoi-seed-tanjung-emas", "Pelabuhan Tanjung Emas (contoh)",
     ((110.418, -6.952), (110.431, -6.952), (110.431, -6.940), (110.418, -6.940))),
    ("aoi-seed-terboyo-industry", "Kawasan Industri Terboyo (contoh)",
     ((110.461, -6.949), (110.473, -6.949), (110.473, -6.938), (110.461, -6.938))),
    ("aoi-seed-kaligawe-road", "Koridor Jalan Kaligawe (contoh)",
     ((110.454, -6.959), (110.467, -6.959), (110.467, -6.952), (110.454, -6.952))),
)
PARTS = ("corr", "unw_phase", "conncomp", "water_mask")


def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def local_phase_edges(phase, valid, component):
    edges = []
    for first, second in ((np.s_[:, :-1], np.s_[:, 1:]), (np.s_[:-1, :], np.s_[1:, :])):
        joined = valid[first] & valid[second] & (component[first] == component[second])
        edges.append(np.abs(phase[second][joined].astype(np.float64) -
                            phase[first][joined].astype(np.float64)))
    values = np.concatenate(edges)
    return {
        "sameSnaphuComponentFourNeighborEdges": int(values.size),
        "absoluteUnwrappedPhaseDifferenceRadians": {
            "median": round(float(np.median(values)), 4) if values.size else None,
            "p95": round(float(np.percentile(values, 95)), 4) if values.size else None,
            "maximum": round(float(values.max()), 4) if values.size else None,
        },
        "edgesWithAbsolutePhaseDifferenceGreaterThanPi": int(np.count_nonzero(values > np.pi)),
        "edgeInterpretation": "local spatial smoothness only; no independent unwrapping/geodetic accuracy validation",
    }


def analyze(directory):
    arrays, valid_masks, hashes = {}, {}, {}
    signature = None
    for part in PARTS:
        filename = PRODUCT + "_" + part + ".tif"
        path = directory / filename
        if not path.is_file():
            raise FileNotFoundError("Required private source TIFF missing: " + filename)
        hashes[part + ".tif"] = sha256(path)
        with rasterio.open(path) as ds:
            current = (ds.width, ds.height, tuple(ds.transform), ds.crs.to_epsg() if ds.crs else None)
            if current[-1] != 32749 or current[:2] != (1312, 541) or any(abs(n - 80) > 1e-6 for n in ds.res):
                raise ValueError("Invalid geocoded 80m EPSG:32749 input: " + part)
            if signature is None:
                signature = current
                transform, shape = ds.transform, ds.shape
            elif current != signature:
                raise ValueError("GeoTIFF pixel grids are not aligned: " + part)
            arrays[part], valid_masks[part] = ds.read(1), ds.read_masks(1) > 0

    corr, phase, component, water = (arrays[k] for k in PARTS)
    results = []
    for aoi_id, name, ring in AOIS:
        geometry = {"type": "Polygon", "coordinates": [[list(p) for p in ring] + [list(ring[0])]]}
        projected = transform_geom("EPSG:4326", "EPSG:32749", geometry)
        inside = geometry_mask([projected], out_shape=shape, transform=transform,
                               invert=True, all_touched=False)
        land = inside & valid_masks["water_mask"] & (water == 1)
        qualified = (land & valid_masks["corr"] & valid_masks["unw_phase"] &
                     valid_masks["conncomp"] & np.isfinite(corr) & np.isfinite(phase) &
                     (component > 0) & (corr >= .7))
        labeled, cluster_count = label(qualified, structure=np.ones((3, 3), dtype=np.uint8))
        sizes = np.bincount(labeled[qualified]) if qualified.any() else np.array([])
        ids, counts = np.unique(component[qualified].astype(int), return_counts=True)
        results.append({
            "aoiId": aoi_id, "aoiName": name,
            "boundaryStatus": "ILLUSTRATIVE_UNVERIFIED",
            "landPixelCenters": int(land.sum()),
            "qualifiedResearchPixelsCoherenceGe07": int(qualified.sum()),
            "qualityEightNeighborSpatialClusters": int(cluster_count),
            "largestQualitySpatialClusterPixels": int(sizes[1:].max()) if sizes.size > 1 else 0,
            "snaphuConnectedComponentIdCounts": [
                {"id": int(cid), "pixels": int(count)} for cid, count in zip(ids, counts)
            ],
            "phaseEdgeConsistency": local_phase_edges(phase, qualified, component),
        })
    return {
        "schema": "baruna-hyp3-phase-spatial-continuity-qa-v1",
        "asOf": "2026-11-18",
        "source": {
            "product": PRODUCT, "acquisitionDates": ["2026-10-02", "2026-10-14"],
            "fullBurstID": "076_162214_IW2",
            "processing": "ASF HyP3 hyp3_isce2 / ISCE2, single 12-day interferogram",
            "geocodedEPSG": 32749, "nominalPixelSpacingMeters": 80,
            "rasterRows": 541, "rasterColumns": 1312,
            "inputGeoTIFFSha256": hashes, "sourceFilesCommitted": False,
        },
        "method": {
            "landDefinition": "raster valid water_mask==1",
            "qualifiedDefinition": "land, valid coherence and phase, conncomp>0, coherence>=0.7",
            "polygon": "pixel-center inclusion after EPSG4326->EPSG32749 transform; 3 illustrative seeded polygons",
            "adjacency": "4-neighbor edges with both pixels eligible and same SNAPHU connected component ID",
            "phaseDifference": "absolute difference between adjacent geocoded unwrapped phase samples in radians",
            "thresholdFlag": "abs difference > pi is a heuristic edge jump flag, not automatic error certification",
            "independentUnwrappingCheck": False,
        },
        "results": results,
        "scientificGates": {
            "rawSourcePixelsAnalyzed": True, "singlePairOnly": True,
            "stableReferenceValidated": False, "atmosphericCorrectionsValidated": False,
            "phaseUnwrappingIndependentlyValidated": False, "multiTemporalLOSValidated": False,
            "annualVerticalMotionAvailable": False, "assetRiskRankingAllowed": False,
        },
        "limitations": [
            "All counts are derived from one 12-day HyP3 interferogram, not a validated geodetic time series",
            "A high coherence or a smooth phase field cannot independently confirm correct phase unwrapping",
            "The SNAPHU connected-component ID does not itself certify stable geodetic reference or atmospheric correction",
            "Illustrative AOIs do not establish surveyed infrastructure or asset-specific deformation",
            "No displacement, annual rate, flood depth, or operational safety risk is calculated",
        ],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input-dir", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    doc = analyze(args.input_dir)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("SINGLE_PAIR_SPATIAL_PHASE_QA_ONLY")
    for entry in doc["results"]:
        edge = entry["phaseEdgeConsistency"]
        print(entry["aoiId"], entry["qualifiedResearchPixelsCoherenceGe07"],
              "qualified pixels,", edge["sameSnaphuComponentFourNeighborEdges"],
              "eligible four-neighbor edges,", edge["edgesWithAbsolutePhaseDifferenceGreaterThanPi"],
              "phase jumps >pi")
    print("NO_DISPLACEMENT_OR_RISK_ESTIMATED")
