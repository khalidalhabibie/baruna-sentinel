"""Offline safety/identity tests for BARUNA's private CORS ZIP reader (no real BIG data)."""
import gzip
import io
from pathlib import Path
import tempfile
import unittest
import zipfile

from scripts.local_cors_qc import read_header, safe_members


def line(text, label):
    return f"{text:<60}{label:<20}\n".encode("ascii")


def rinex(station="CSEM", kind="O"):
    return (
        line(f"     2.11           {kind}                   G", "RINEX VERSION / TYPE") +
        line(station, "MARKER NAME") +
        line("", "END OF HEADER") +
        b" 26 11 15  0  0  0.0000000  0  0\n"
    )


class LocalCorsQcSafetyTest(unittest.TestCase):
    def test_header_identity_is_observation_derived(self):
        marker, version, body = read_header(rinex("CSMG"), "misleading_csem.26o")
        self.assertEqual(marker, "CSMG")
        self.assertEqual(version, "2.11")
        self.assertIn(b"MARKER NAME", body)

    def test_reject_navigation_and_missing_marker(self):
        with self.assertRaisesRegex(ValueError, "observation RINEX"):
            read_header(rinex("CSEM", kind="N"), "file.26o")
        with self.assertRaisesRegex(ValueError, "MARKER NAME"):
            read_header(line("     2.11           O                   G", "RINEX VERSION / TYPE")+
                        line("", "END OF HEADER"), "file.26o")

    def test_parse_locally_gzipped_header(self):
        name,version,_=read_header(gzip.compress(rinex("CSEM")), "sample.26o.gz")
        self.assertEqual(name, "CSEM")
        self.assertEqual(version, "2.11")

    def test_zip_inspection_ignores_navigation_and_never_extracts_paths(self):
        with tempfile.TemporaryDirectory() as root:
            archive=Path(root)/"private.zip"
            with zipfile.ZipFile(archive,"w") as z:
                z.writestr("csem/CSEM2026.26o",rinex())
                z.writestr("csem/CSEM2026.26n",b"navigation")
            records=list(safe_members(archive))
            self.assertEqual(len(records),1)
            self.assertEqual(records[0][0],"CSEM2026.26o")
            self.assertEqual(read_header(*reversed(records[0]))[0],"CSEM")

    def test_reject_zip_traversal_and_hatanaka(self):
        with tempfile.TemporaryDirectory() as root:
            archive=Path(root)/"private.zip"
            with zipfile.ZipFile(archive,"w") as z:
                z.writestr("../station.26o",rinex())
            with self.assertRaisesRegex(ValueError,"Unsafe ZIP"):
                list(safe_members(archive))
            archive2=Path(root)/"compressed.zip"
            with zipfile.ZipFile(archive2,"w") as z:
                z.writestr("site.26d",b"Hatanaka compressed payload")
            with self.assertRaisesRegex(ValueError,"Hatanaka"):
                list(safe_members(archive2))


if __name__=="__main__":
    unittest.main()
