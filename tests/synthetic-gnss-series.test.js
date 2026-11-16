import test from "node:test";
import assert from "node:assert/strict";
import {makeSyntheticEnu,ENU_DEMO_CONTRACT,ENU_DEMO_STATIONS} from "../src/synthetic-gnss-series.js";

test("ENU video series is explicitly synthetic and does not masquerade as official data",()=>{
 assert.equal(ENU_DEMO_CONTRACT.provenance,"SYNTHETIC_VIDEO_ONLY");
 assert.equal(ENU_DEMO_CONTRACT.sourceStatus,"OFFICIAL_NUMERIC_CSV_UNAVAILABLE");
 assert.deepEqual(ENU_DEMO_STATIONS,["CSEM","CSMG"]);
 for(const station of ENU_DEMO_STATIONS){
  const rows=makeSyntheticEnu(station);
  assert.equal(rows.length,58);
  assert.equal(rows[0].month,"2022-01");
  assert.equal(rows.at(-1).month,"2026-10");
  for(const row of rows){
   assert.equal(typeof row.east,"number");
   assert.equal(typeof row.north,"number");
   assert.equal(typeof row.up,"number");
   assert.ok(Object.isFrozen(row));
  }
  assert.deepEqual(rows,makeSyntheticEnu(station));
 }
 assert.notDeepEqual(makeSyntheticEnu("CSEM"),makeSyntheticEnu("CSMG"));
 assert.throws(()=>makeSyntheticEnu("UNKNOWN"),RangeError);
});
