#!/usr/bin/env bash
# BARUNA Spatial: single entry point for reproducible local public-data acquisition.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required (python.org/downloads)." >&2; exit 1
fi
if [ ! -x ".venv/bin/python" ]; then python3 -m venv .venv; fi

PY=".venv/bin/python"
if ! "$PY" -c "import rasterio, numpy" >/dev/null 2>&1; then
  echo "Installing rasterio for GeoTIFF validation and clipping..."
  "$PY" -m pip install --disable-pip-version-check "rasterio>=1.4,<2" 
fi

exec "$PY" scripts/data-acquisition/acquire.py "$@"
