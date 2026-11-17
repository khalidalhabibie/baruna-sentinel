#!/usr/bin/env python3
"""Convert authorized, LOCAL CSEM and CSMG RINEX observation archives to a private QC JSON.

Installation (on your computer):
    python3 -m pip install georinex numpy
    python3 scripts/local_cors_qc.py --csem /private/CSEM.zip --csmg /private/CSMG.zip \
        --output /private/baruna_csem_csmg_qc.json

This is NOT a PPP position solution, official BIG certificate, displacement
measurement, or upload. Nothing is downloaded. Navigation files are ignored.
RINEX 2/3 observation files can be read by GeoRinex. Convert Hatanaka
compressed observation files (.crx/.d) locally to ordinary RINEX first.
"""
from __future__ import annotations

import argparse
from collections import defaultdict
from datetime import date, datetime
import gzip
import io
import hashlib
import json
from pathlib import Path
import re
import sys
import tempfile
import zipfile

MAX_ARCHIVE_BYTES = 800_000_000
MAX_UNCOMPRESSED_MEMBER = 110_000_000
# Monthly BIG downloads commonly contain 30 OBS + 30 NAV members.
# Keep a bounded per-archive cap without rejecting this normal packaging.
MAX_FILES = 128
MAX_DAYS = 366
STATIONS = {"csem", "csmg"}
# Preserve original archive position and the true four-letter RINEX MARKER NAME.
OBS_EXT = re.compile(r"(?:\.rnx|\.obs|\.\d{2}o|\.rnx\.gz|\.obs\.gz|\.\d{2}o\.gz)$",re.I)
UNSUPPORTED = re.compile(r"(?:\.crx|\.crx\.gz|\.\d{2}d|\.\d{2}d\.gz|\.z)$",re.I)
NAV_EXT = re.compile(r"(?:\.nav|\.gnav|\.lnav|\.n|\.r|\.g|\.\d{2}[nNgGlL])(?:\.gz)?$",re.I)


def safe_members(path: Path):
    """Yield bounded ordinary observation files; do not extract arbitrary ZIP paths."""
    if path.stat().st_size > MAX_ARCHIVE_BYTES:
        raise ValueError("Archive exceeds 800 MB local processing limit")
    if path.suffix.lower() == ".zip":
        with zipfile.ZipFile(path) as archive:
            files = [info for info in archive.infolist() if not info.is_dir()]
            if len(files) > MAX_FILES:
                raise ValueError("ZIP contains too many entries (max 128)")
            for info in files:
                name = Path(info.filename).name
                # Prevent path traversal, duplicate inner paths, encrypted entries, bombs.
                if (Path(info.filename).is_absolute() or ".." in Path(info.filename).parts
                        or "\\" in info.filename or not name or info.flag_bits & 0x1):
                    raise ValueError("Unsafe ZIP entry or encrypted archive")
                if info.file_size > MAX_UNCOMPRESSED_MEMBER:
                    raise ValueError("RINEX member exceeds 110 MB limit")
                if UNSUPPORTED.search(name):
                    raise ValueError("Hatanaka/Unix-compressed observation: convert to standard RINEX first: "+name)
                if OBS_EXT.search(name) and not NAV_EXT.search(name):
                    with archive.open(info) as handle:
                        data = handle.read(MAX_UNCOMPRESSED_MEMBER + 1)
                    if len(data) > MAX_UNCOMPRESSED_MEMBER:
                        raise ValueError("RINEX member too large")
                    yield name, data
    else:
        name = path.name
        if UNSUPPORTED.search(name):
            raise ValueError("Convert Hatanaka/Unix-compressed observations to standard RINEX first")
        if not OBS_EXT.search(name):
            raise ValueError("Expected RINEX observation .rnx / .obs / .YYo (or .gz or ZIP)")
        yield name, path.read_bytes()


def read_header(buffer: bytes, filename: str):
    """Inspect actual RINEX header; never trust station name from ZIP basename."""
    if filename.lower().endswith(".gz"):
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(buffer)) as stream:
                buffer = stream.read(MAX_UNCOMPRESSED_MEMBER + 1)
        except OSError as exc:
            raise ValueError("Invalid gzip observation member") from exc
    if len(buffer) > MAX_UNCOMPRESSED_MEMBER:
        raise ValueError("Decompressed observation exceeds 110 MB")
    header = buffer[:100_000].decode("ascii",errors="replace").splitlines()
    marker = None
    version = None
    for line in header:
        if "RINEX VERSION / TYPE" in line[60:]:
            version = line[:9].strip()
            kind = line[20:21].upper()
            if kind != "O":
                raise ValueError("Only observation RINEX allowed (not navigation): "+filename)
        if "MARKER NAME" in line[60:]:
            marker = line[:60].strip()
        if "END OF HEADER" in line[60:]:
            break
    else:
        raise ValueError("No valid RINEX END OF HEADER in "+filename)
    if not version or not marker:
        raise ValueError("RINEX version and MARKER NAME required in "+filename)
    return marker, version, buffer


def timestamp_strings(times):
    import numpy as np
    array = np.asarray(times).astype("datetime64[s]")
    return [str(t).replace("T"," ") for t in array]


def summarize_observations(dataset, station: str, name: str):
    """Count on-grid time epochs and actual finite, positive C/P code measurements."""
    import numpy as np
    if "time" not in dataset.coords or "sv" not in dataset.coords:
        raise ValueError("GeoRinex did not decode observation time and satellites")
    timestamp = timestamp_strings(dataset.time.values)
    satellites = [str(s) for s in dataset.sv.values]
    if len(timestamp)<2 or len(satellites)==0:
        raise ValueError("Need at least two observed epochs and actual satellites")
    # Never treat a RINEX header alone as constellation evidence.
    mask=np.zeros((len(timestamp),len(satellites)),dtype=bool)
    code_fields=[]
    for variable,values in dataset.data_vars.items():
        if not (variable.startswith("C") or variable.startswith("P")):
            continue
        if values.dims!=("time","sv"):
            continue
        arr=np.asarray(values.values)
        if not np.issubdtype(arr.dtype,np.number):
            continue
        mask|=(np.isfinite(arr)&(arr>0))
        code_fields.append(variable)
    if not code_fields or not mask.any():
        raise ValueError("No populated code/pseudorange observations; cannot claim constellation QC")
    daily=defaultdict(list)
    for idx,ts in enumerate(timestamp):
        day=ts[:10]
        try:
            t=datetime.fromisoformat(ts)
        except ValueError as exc:
            raise ValueError("Invalid RINEX observation epoch") from exc
        if (t.microsecond or t.second not in (0,30) or
                t.minute<0 or t.minute>59 or t.hour<0 or t.hour>23):
            raise ValueError("QC schema requires actual 30-second grid timestamps; resample separately")
        daily[day].append(idx)
    if len(daily)>MAX_DAYS:
        raise ValueError("Too many observation days")
    records=[]
    for day,indices in sorted(daily.items()):
        times=[timestamp[i] for i in indices]
        unique=sorted(set(times))
        if len(unique)!=len(times):
            raise ValueError("Duplicate observed epoch timestamps in RINEX file")
        n=len(unique)
        if n>2880:
            raise ValueError("More than 2880 observed epochs on one 30-second day")
        stamps=[datetime.fromisoformat(t) for t in unique]
        deltas=[int((t2-t1).total_seconds()) for t1,t2 in zip(stamps,stamps[1:])]
        gaps=[d for d in deltas if d>30]
        present={}
        for sys in ["G","R","E","S","C","J"]:
            cols=np.array([s.startswith(sys) for s in satellites])
            present[sys]=int(np.count_nonzero(mask[np.ix_(indices,cols)].any(axis=1))) if cols.any() else 0
        gre_cols=np.array([s.startswith(("G","R","E")) for s in satellites])
        present["G+R+E"]=int(np.count_nonzero(
            np.logical_and.reduce([mask[np.ix_(indices, np.array([s.startswith(code) for s in satellites]))].any(axis=1)
                                   if any(s.startswith(code) for s in satellites) else np.zeros(n,dtype=bool)
                                   for code in ("G","R","E")])
        )) if gre_cols.any() else 0
        d=date.fromisoformat(day)
        records.append({
            "station":station,"date":day,"doy":d.timetuple().tm_yday,
            "epochs":n,"expected_full_day_30s_epochs":2880,
            "long_gaps_gt30s":len(gaps),
            "largest_gap_min":round(max(gaps,default=0)/60,2),
            "first_epoch_gps":unique[0],"last_epoch_gps":unique[-1],
            "epochs_with_C1_by_constellation":present,
            "qc_file_name":name,  # viewer intentionally discards raw source paths
        })
    return records,code_fields


def convert_pair(csem_path: Path,csmg_path: Path):
    try:
        import georinex as gr
    except ImportError as exc:
        raise RuntimeError("GeoRinex is required locally: python3 -m pip install georinex numpy") from exc
    result=[]
    source_info=[]
    for expected,archive in [("csem",csem_path),("csmg",csmg_path)]:
        if not archive.is_file():
            raise FileNotFoundError(str(archive))
        candidates=list(safe_members(archive))
        if not candidates:
            raise ValueError("No ordinary RINEX observation entries found in "+archive.name)
        found=[]
        for name,data in candidates:
            # Keep the exact failing station/day visible. GeoRinex often writes
            # long NumPy warnings; without context the real error is obscured.
            try:
                marker,version,uncompressed=read_header(data,name)
                if not marker.upper().startswith(expected.upper()):
                    raise ValueError("RINEX MARKER NAME "+marker+" does not match expected "+expected.upper()+
                                     ". Do not assign station identity using ZIP number or filename.")
                suffix = ".rnx"
                with tempfile.TemporaryDirectory(prefix="baruna_private_qc_") as work:
                    target=Path(work)/("observation"+suffix)
                    target.write_bytes(uncompressed)
                    observations=gr.load(str(target))
                    rec,fields=summarize_observations(observations,expected,name)
                    found.extend(rec)
                    source_info.append({
                        "station":expected,"marker_name":marker,"rinex_version":version,
                        "archive_sha256":hashlib.sha256(archive.read_bytes()).hexdigest(),
                        "original_file":name,"code_fields":fields
                    })
                print("LOCAL_QC_FILE_OK: "+expected.upper()+" / "+name+
                      " / "+str(len(rec))+" station-day record(s)",flush=True)
            except Exception as exc:
                raise ValueError("Failed station "+expected.upper()+" observation file "+name+
                                 ": "+type(exc).__name__+": "+str(exc)) from exc
        result.extend(found)
    record_keys=[(r["station"],r["date"]) for r in result]
    if len(record_keys)!=len(set(record_keys)):
        raise ValueError("Overlapping station/day files detected; provide unique daily observation files")
    years={int(row["date"][:4]) for row in result}
    if len(years)>1:
        raise ValueError("Viewer supports one calendar year at a time; split analyses")
    csem_days={r["date"] for r in result if r["station"]=="csem"}
    csmg_days={r["date"] for r in result if r["station"]=="csmg"}
    return {
        "schema":"baruna-private-cors-qc-v1",
        "method":"GeoRinex read-only RINEX observation parsing; observed 30-second pseudorange epoch coverage",
        "disposition":"PRIVATE LOCAL QC: source is user-provided, not BIG-certified; not a position solution",
        "provenance":{
            "origin":"USER_SUPPLIED_UNVERIFIED",
            "verification":"RINEX MARKER NAME matched; ownership/frame/authenticity not independently verified",
            "processing":"local-only",
            "source_files":source_info
        },
        "summary":{
            "paired_calendar_days":len(csem_days & csmg_days),
            "station_day_records":len(result),
            "note":"QC of actual pseudorange presence; no position solution, displacement or asset-risk inference"
        },
        "records":sorted(result,key=lambda r:(r["date"],r["station"]))
    }


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--csem",required=True,type=Path,help="Authorized CSEM RINEX observation ZIP/file")
    ap.add_argument("--csmg",required=True,type=Path,help="Authorized CSMG RINEX observation ZIP/file")
    ap.add_argument("--output",required=True,type=Path,help="LOCAL destination JSON; never commit publicly")
    args=ap.parse_args()
    if args.output.resolve() in [args.csem.resolve(),args.csmg.resolve()]:
        ap.error("Output must not overwrite private input data")
    try:
        out=convert_pair(args.csem,args.csmg)
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(out,indent=2,ensure_ascii=False),encoding="utf8")
        print("LOCAL_QC_COMPLETE: "+str(len(out["records"]))+" station-day records; "+
              str(out["summary"]["paired_calendar_days"])+" matched calendar day(s)")
        print("Saved privately: "+str(args.output))
        print("No PPP positioning, subsidence or asset risk was calculated.")
    except Exception as exc:
        print("LOCAL_QC_BLOCKED: "+str(exc),file=sys.stderr)
        return 2
    return 0

if __name__=="__main__":
    raise SystemExit(main())
