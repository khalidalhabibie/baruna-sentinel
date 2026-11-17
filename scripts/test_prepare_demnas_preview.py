"""Local, synthetic-only tests for bounded user-supplied DEMNAS GeoTIFF prep."""
from pathlib import Path
import tempfile
import unittest

try:
    import numpy as np
    import rasterio
    from rasterio.transform import from_bounds
except ImportError:
    np = None
    rasterio = None

from scripts.prepare_demnas_preview import prepare


@unittest.skipUnless(rasterio is not None, "Install rasterio and numpy to test GeoTIFF extraction")
class PrepareDemnasPreviewTests(unittest.TestCase):
    def _write(self, path: Path, fill: float, coverage=True):
        arr = np.full((100, 100), fill, dtype="float32")
        # Stand-in sample covers AOI; no real DEMNAS data in tests.
        bounds = (110.36, -7.04, 110.50, -6.86) if coverage else (111.0, -8.0, 111.1, -7.9)
        with rasterio.open(path, "w", driver="GTiff", height=100, width=100,
                            count=1, crs="EPSG:4326", dtype="float32",
                            transform=from_bounds(*bounds, 100, 100),
                            nodata=-9999.0) as dst:
            dst.write(arr, 1)

    def test_valid_synthetic_geotiff_is_resampled_and_never_authenticates_source(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "UNIT_TEST_SYNTHETIC.tif"
            self._write(path, 2.5)
            x = prepare(path)
            self.assertEqual(x["schema"], "baruna-demnas-local-raster-preview-v1")
            self.assertEqual(x["validPixelCount"], 400)
            self.assertEqual(x["sourceOriginalCrs"], "EPSG:4326")
            self.assertEqual(x["bboxWgs84"], [110.375, -7.025, 110.485, -6.875])
            self.assertFalse(x["originVerifiedByBig"])
            self.assertFalse(x["canInferFloodDepth"])
            self.assertFalse(x["canCalculateSubsidence"])
            self.assertFalse(x["canRankRealAsset"])
            self.assertAlmostEqual(x["grid"][10][10], 2.5)
            self.assertEqual(len(x["sourceSha256"]), 64)

    def test_nodata_sentinel_cannot_become_elevation(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "UNIT_TEST_INVALID.tif"
            self._write(path, 1.13427e38)
            with self.assertRaisesRegex(ValueError, "Fewer than 10"):
                prepare(path)

    def test_raster_outside_coverage_is_not_fabricated(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / "UNIT_TEST_NO_COVERAGE.tif"
            self._write(path, 2.5, coverage=False)
            with self.assertRaisesRegex(ValueError, "Fewer than 10"):
                prepare(path)


if __name__ == "__main__":
    unittest.main()
