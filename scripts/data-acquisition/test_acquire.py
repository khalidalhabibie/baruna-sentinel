"""Offline tests for the public-data acquisition entrypoint; no network or rasterio needed."""
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("acquire", HERE / "acquire.py")
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class DataAcquisitionTests(unittest.TestCase):
    def test_import_previous_archive_and_preserve_existing_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            archive = root / "BARUNA_DATA_REAL.zip"
            destination = root / "local" / "BARUNA_DATA_REAL"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("BARUNA_DATA_REAL/official_reference/example.pdf", "%PDF-test")
                z.writestr("../escaped.txt", "must not escape")
            mod.import_existing(archive, destination)
            expected = destination / "official_reference" / "example.pdf"
            self.assertEqual(expected.read_text(), "%PDF-test")
            self.assertFalse((root / "escaped.txt").exists())
            expected.write_text("new")
            mod.import_existing(archive, destination)
            self.assertEqual(expected.read_text(), "new")

    def test_osm_geometry_is_context_only(self):
        result = mod.osm_geojson([
            {"type": "way", "id": 123, "geometry": [
                {"lat": -6.94, "lon": 110.4},
                {"lat": -6.95, "lon": 110.41},
            ], "tags": {"highway": "service"}}
        ])
        self.assertEqual(result["features"][0]["geometry"]["type"], "LineString")
        self.assertIn("not surveyed", result["limitation"])

    def test_manifest_entry_replaces_old_result(self):
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            manifest = {"datasets": []}
            p = base / "example.json"
            p.write_text(json.dumps({"ok": True}))
            mod.entry(manifest, base, "x", "verified_reference_pdf", p)
            mod.entry(manifest, base, "x", "rejected_invalid_pixels", p)
            self.assertEqual(len(manifest["datasets"]), 1)
            self.assertEqual(manifest["datasets"][0]["status"], "rejected_invalid_pixels")
            self.assertEqual(len(manifest["datasets"][0]["sha256"]), 64)


if __name__ == "__main__":
    unittest.main()
