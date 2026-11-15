#!/usr/bin/env python3
"""Verify real archived multi-GNSS observations with GeoRinex; emit audit JSON.

Does NOT compute geodetic station displacement or associate BAKO observations
with historical CSEM positions / Semarang assets.

Usage:
  python scripts/verify_igs_rinex.py
  python scripts/verify_igs_rinex.py --file /path/to/real-station.crx.gz --station CSMG --source-url https://srgi.big.go.id
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ARCHIVES = (
    "https://igs.bkg.bund.de/root_ftp/IGS/obs/2025/001/BAKO00IDN_R_20250010000_01D_30S_MO.crx.gz",
    "https://lox.ucsd.edu/pub/rinex/2025/205/E/BAKO00IDN_R_20252050000_01D_30S_MO.crx.gz",
)
SYSTEMS = {
    "G": "GPS", "R": "GLONASS", "E": "Galileo",
    "C": "BeiDou", "J": "QZSS", "I": "NavIC", "S": "SBAS",
}

def retrieve(directory: Path) -> tuple[Path, str]:
    directory.mkdir(parents=True, exist_ok=True)
    errors = []
    for url in ARCHIVES:
        target = directory / url.rsplit("/", 1)[-1]
        try:
            print(f"Attempting original archive: {url}", flush=True)
            req = Request(url, headers={"User-Agent": "BarunaSentinel-Competition-QC/0.1"})
            with urlopen(req, timeout=50) as response:
                content_type = response.headers.get("Content-Type", "")
                if "text/html" in content_type.lower():
                    raise ValueError(f"Received HTML rather than a GNSS archive: {content_type}")
                raw = response.read(16_000_000)
            if len(raw) < 100_000:
                raise ValueError(f"Archive unexpectedly short: {len(raw)} bytes")
            if not raw.startswith(b"\x1f\x8b"):
                raise ValueError("Not a gzip archive; unexpected payload")
            target.write_bytes(raw)
            print(f"Downloaded {len(raw):,} compressed bytes", flush=True)
            return target, url
        except Exception as exc:
            errors.append(f"{url}: {type(exc).__name__}: {exc}")
            print(f"ARCHIVE_UNAVAILABLE: {errors[-1]}", flush=True)
    raise RuntimeError("No accessible authentic IGS archive:\n" + "\n".join(errors))

def year_doy_from_filename(path: Path) -> datetime | None:
    match = re.search(r"_R_(\d{4})(\d{3})\d{4}_", path.name)
    if match:
        return datetime.strptime(match.group(1) + match.group(2), "%Y%j")
    return None

def analyze(path: Path, source_url: str, minutes: int, station: str, station_evidence: str) -> dict:
    import georinex as gr
    import numpy as np

    start = year_doy_from_filename(path)
    kwargs = {}
    if start is not None:
        kwargs["tlim"] = [
            start.strftime("%Y-%m-%dT%H:%M"),
            (start + timedelta(minutes=minutes)).strftime("%Y-%m-%dT%H:%M"),
        ]
    print(f"GeoRinex loading {path.name}; time window {kwargs.get('tlim', 'file default')}", flush=True)
    obs = gr.load(str(path), **kwargs)
    if "time" not in obs.coords or "sv" not in obs.coords:
        raise ValueError("The input did not decode to a RINEX observation dataset")
    sv = [str(v) for v in obs.sv.values]
    if not sv:
        raise ValueError("No satellite IDs found")
    times = obs.time.values
    if len(times) < 2:
        raise ValueError("Too few genuine observation epochs decoded")
    masks = np.zeros((len(times), len(sv)), dtype=bool)
    code_fields = []
    for name, var in obs.data_vars.items():
        # Pseudorange data (RINEX C-type) distinguish actual populated records
        if not name.startswith("C") or var.dims != ("time", "sv"):
            continue
        arr = var.values
        if np.issubdtype(arr.dtype, np.number):
            code_fields.append(name)
            masks |= np.isfinite(arr)
    if not code_fields:
        raise ValueError("No populated/parseable code-pseudorange fields")
    per_system = {}
    gps_mask = np.zeros(len(sv), dtype=bool)
    for code, title in SYSTEMS.items():
        col = np.array([item.startswith(code) for item in sv])
        if code == "G":
            gps_mask = col
        if not col.any():
            continue
        present = masks[:, col]
        per_epoch = present.sum(axis=1)
        observed = int(present.sum())
        if observed:
            per_system[title] = {
                "satellites_with_pseudorange": int(present.any(axis=0).sum()),
                "pseudorange_observation_cells": observed,
                "epochs_with_pseudorange": int((per_epoch > 0).sum()),
                "mean_satellites_per_epoch": round(float(per_epoch.mean()), 3),
            }
    if len(per_system) < 2:
        raise ValueError(f"At least two *observed* constellations required; found: {list(per_system)}")
    total_sat_per_epoch = masks.sum(axis=1)
    gps_sat_per_epoch = masks[:, gps_mask].sum(axis=1)
    differences = total_sat_per_epoch - gps_sat_per_epoch
    # Observational comparison, not positioning accuracy or structural risk.
    result = {
        "schema": "baruna-sentinel-real-multignss-qc-v1",
        "source": {
            "type": "public_igs_archive" if station_evidence == "original_archive_path" else "user_supplied_rinex",
            "station": station,
            "station_evidence": station_evidence,
            "archive_url": source_url,
            "filename": path.name,
            "sha256_compressed": hashlib.sha256(path.read_bytes()).hexdigest(),
        },
        "decoder": "georinex",
        "sample": {
            "first_epoch": str(times[0]),
            "last_epoch": str(times[-1]),
            "epochs": len(times),
            "measurement_type": "populated code pseudorange cells",
            "code_fields_examined": code_fields,
        },
        "constellations_with_actual_pseudorange": per_system,
        "same_epochs_comparison": {
            "gps_only_mean_satellites_with_measurements": round(float(gps_sat_per_epoch.mean()), 3),
            "multi_gnss_mean_satellites_with_measurements": round(float(total_sat_per_epoch.mean()), 3),
            "epochs_with_additional_non_gps_observations": int((differences > 0).sum()),
            "conclusion": "Observational availability comparison only, NOT positioning accuracy",
        },
        "relationship_to_CSEM": {
            "linked_to_semarang_movement_solution": False,
            "reason": "QC of a separately processed RINEX sample is not a time-matched geodetic position solution associated with CSEM historical GPS positions (2010-2021) or a measured port asset.",
        },
        "limitations": [
            "Actual populated pseudorange, not position solutions.",
            "No geometry, SNR, cycle-slip, multipath or receiver clock accuracy claim.",
            "Does not infer subsidence or structural failure from a BAKO receiver.",
        ],
    }
    return result

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--file", type=Path, help="Existing original, unmodified RINEX observation file")
    parser.add_argument("--minutes", type=int, default=20, help="Archive observation window, default 20 min")
    parser.add_argument("--station", help="Operator-declared station code for --file, e.g. CSMG (not independently verified by CLI)")
    parser.add_argument("--source-url", help="Public provenance page or original archive URL for --file; never put credentials in URLs")
    parser.add_argument("--output", type=Path, default=Path("reports/real_multignss_qc.json"))
    args = parser.parse_args()
    if args.minutes < 2 or args.minutes > 120:
        parser.error("--minutes must be 2–120")
    if args.station and not re.fullmatch(r"[A-Za-z0-9_-]{3,16}", args.station):
        parser.error("--station must be 3–16 alphanumeric/underscore/hyphen characters")
    if args.source_url and not args.source_url.startswith("https://"):
        parser.error("--source-url must be an HTTPS URL without credentials or tokens")
    if args.source_url and ("@" in args.source_url.split("/",3)[2] or "?" in args.source_url):
        parser.error("--source-url must not contain credentials or query parameters")
    if not args.file and args.station:
        parser.error("--station is only for --file; automatic archive station is BAKO00IDN")
    if args.file:
        if not args.station:
            parser.error("--station is required with --file; file names alone do not independently verify station identity")
        path, source = args.file, (args.source_url or "USER_PROVIDED_LOCAL_FILE")
        station, station_evidence = args.station.upper(), "operator_declared_unverified"
    else:
        path, source = retrieve(Path("tmp/igs"))
        station, station_evidence = "BAKO00IDN", "original_archive_path"
    if not path.exists():
        raise FileNotFoundError(path)
    result = analyze(path, source, args.minutes, station, station_evidence)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    print("VERIFIED_REAL_MULTI_GNSS_QC_JSON=" + str(args.output), flush=True)
    print("OBSERVATION_QC_SUMMARY=" + json.dumps({
        "source": result["source"]["filename"],
        "epochs": result["sample"]["epochs"],
        "systems": list(result["constellations_with_actual_pseudorange"]),
        **result["same_epochs_comparison"],
    }), flush=True)
    return 0

if __name__ == "__main__":
    sys.exit(main())
