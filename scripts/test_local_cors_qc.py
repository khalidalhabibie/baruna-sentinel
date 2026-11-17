"""Offline safety/identity tests for BARUNA's private CORS ZIP reader (no real BIG data)."""
import gzip
import io
from pathlib import Path
import tempfile
import unittest
import zipfile
import sys
import types
from unittest.mock import patch

from scripts.local_cors_qc import read_header, safe_members, convert_pair


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

    def test_monthly_big_archive_with_obs_and_nav_pairs(self):
        # Actual authorized SRGI archives observed in Nov 2026 use the
        # 30-day OBS + NAV convention. The local loader only handles OBS.
        with tempfile.TemporaryDirectory() as root:
            archive=Path(root)/"csem_month.zip"
            with zipfile.ZipFile(archive,"w") as z:
                for day in range(30):
                    z.writestr(f"rinex/csem{290+day:03d}0.26o",rinex("CSEM"))
                    z.writestr(f"nav/csem{290+day:03d}0.26n",b"navigation only")
            records=list(safe_members(archive))
            self.assertEqual(len(records),30)
            self.assertTrue(all(name.endswith(".26o") for name,_ in records))
            self.assertEqual(read_header(records[0][1], records[0][0])[0],"CSEM")

    def test_zip_entry_limit_remains_bounded(self):
        with tempfile.TemporaryDirectory() as root:
            archive=Path(root)/"too_many_entries.zip"
            with zipfile.ZipFile(archive,"w") as z:
                for day in range(129):
                    z.writestr(f"misc/file{day:03d}.txt",b"dummy")
            with self.assertRaisesRegex(ValueError,"too many entries"):
                list(safe_members(archive))

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


    def test_qc_catches_failing_rinex_file_with_station_and_day(self):
        # Synthetic header and deterministic mocked GeoRinex failure; not
        # a measurement or a valid observation file.
        with tempfile.TemporaryDirectory() as root:
            csem=Path(root)/"source_411.zip"
            csmg=Path(root)/"source_137.zip"
            with zipfile.ZipFile(csem,"w") as archive:
                archive.writestr("rinex/csem3130.26o",rinex("CSEM"))
            with zipfile.ZipFile(csmg,"w") as archive:
                archive.writestr("rinex/csmg3130.26o",rinex("CSMG"))
            fake=types.SimpleNamespace(load=lambda path: (_ for _ in ()).throw(ValueError("synthetic malformed epoch")))
            with patch.dict(sys.modules,{"georinex":fake}):
                with self.assertRaisesRegex(ValueError,
                    r"Failed station CSEM observation file csem3130\\.26o: ValueError: synthetic malformed epoch"):
                    convert_pair(csem,csmg)

    def test_no_observation_in_archive_fails_without_creating_qc(self):
        with tempfile.TemporaryDirectory() as root:
            csem=Path(root)/"csem.zip"
            csmg=Path(root)/"csmg.zip"
            with zipfile.ZipFile(csem,"w") as archive:
                archive.writestr("nav/csem3130.26n",b"nav only")
            with zipfile.ZipFile(csmg,"w") as archive:
                archive.writestr("rinex/csmg3130.26o",rinex("CSMG"))
            with patch.dict(sys.modules,{"georinex":types.SimpleNamespace(load=None)}):
                with self.assertRaisesRegex(ValueError,"No ordinary RINEX observation entries"):
                    convert_pair(csem,csmg)


if __name__=="__main__":
    unittest.main()
