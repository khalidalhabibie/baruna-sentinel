import test from "node:test";
import assert from "node:assert/strict";
import {parseLocalQcReport} from "./qc-source.js";

const sample={
  schema:"baruna-sentinel-real-multignss-qc-v1",
  source:{type:"user_supplied_rinex",station:"CSMG",station_evidence:"operator_declared_unverified",
    archive_url:"https://srgi.big.go.id",filename:"CSMG_2026319.26o",sha256_compressed:"a".repeat(64)},
  sample:{first_epoch:"2026-11-14T00:00:00",last_epoch:"2026-11-14T00:19:30",epochs:40},
  constellations_with_actual_pseudorange:{
    GPS:{pseudorange_observation_cells:340},Galileo:{pseudorange_observation_cells:180}
  },
  same_epochs_comparison:{
    gps_only_mean_satellites_with_measurements:8.5,
    multi_gnss_mean_satellites_with_measurements:13,
    epochs_with_additional_non_gps_observations:40
  }
};

test("Plan A imported QC represents decoding, not verified Ina-CORS identity or movement",()=>{
  const r=parseLocalQcReport(sample);
  assert.equal(r.marker,"CSMG");
  assert.equal(r.stationIdentityVerifiedByBig,false);
  assert.equal(r.linkedToCsemMovement,false);
  assert.equal(r.averageGpsPseudorangeSatellitesPerEpoch,8.5);
  assert.equal(r.averageAllPseudorangeSatellitesPerEpoch,13);
  assert.equal(r.observedSystems.length,2);
  assert.equal(r.originalFileSha256,"a".repeat(64));
  assert.ok(r.warnings.some(w=>w.includes("not been verified by BIG")));
  assert.equal(r.verifiedRun,undefined);
});
test("QC JSON cannot masquerade as independently validated source",()=>{
  assert.throws(()=>parseLocalQcReport({...sample,source:{...sample.source,station_evidence:"verified_by_BIG"}}),/Station code/);
  assert.throws(()=>parseLocalQcReport({...sample,source:{...sample.source,sha256_compressed:"fake"}}),/checksum/);
  assert.throws(()=>parseLocalQcReport({...sample,sample:{...sample.sample,epochs:1}}),/epochs/);
});
test("QC source must include real populated pseudorange in multiple GNSS systems",()=>{
  assert.throws(()=>parseLocalQcReport({...sample,constellations_with_actual_pseudorange:{GPS:{pseudorange_observation_cells:340}}}),/multi-GNSS/);
  assert.throws(()=>parseLocalQcReport({...sample,same_epochs_comparison:{...sample.same_epochs_comparison,multi_gnss_mean_satellites_with_measurements:1}}),/pseudorange/);
});
