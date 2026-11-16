import test from "node:test";
import assert from "node:assert/strict";
import {SITE_LOG_REFERENCES,MISSING_EVIDENCE,sourceReadiness} from "./evidence-inventory.js";
test("public station profiles are sourced and do not invent coordinates",()=>{
 assert.deepEqual(SITE_LOG_REFERENCES.map(x=>x.station),["CSEM","CSMG"]);
 assert.ok(SITE_LOG_REFERENCES.every(x=>x.url.startsWith("https://srgi.big.go.id/cors/")));
 assert.equal(SITE_LOG_REFERENCES.find(x=>x.station==="CSEM").latestReceiverInstalled,"2018-08-02");
 assert.equal(SITE_LOG_REFERENCES.find(x=>x.station==="CSMG").installed,"2021-11-30");
 assert.ok(!Object.hasOwn(SITE_LOG_REFERENCES[1],"latitude"));
});
test("empty numeric series is explicit missing, never zero velocity or risk",()=>{
 const v=sourceReadiness();
 assert.equal(v.observationQc.status,"WAITING_FOR_LOCAL_JSON");
 assert.equal(v.observationQc.dateRange,null);
 assert.equal(v.officialNumericVelocityMmYr,null);
 assert.equal(v.measuredAssetDisplacement,null);
 assert.equal(v.operationalRiskRank,null);
 assert.equal(v.allowsAssetDecision,false);
 assert.ok(MISSING_EVIDENCE.some(x=>x.status==="AWAITING_OFFICIAL_NUMERIC"));
});
test("private QC import changes only QC availability, not source-derived asset risk",()=>{
 const bridge={
  scope:"PRIVATE_LOCAL_STATION_OBSERVATION_QC",
  operatorPriorityAllowed:false,
  stationPositionSolutionComputed:false,
  sourceDateRange:["2026-10-17","2026-11-15"],
  full30sDayPairs:21,
  parsed:{calendar:Array(30).fill({})}
 };
 const v=sourceReadiness(bridge);
 assert.equal(v.observationQc.fullDayPairs,21);
 assert.equal(v.observationQc.totalDays,30);
 assert.equal(v.missing.length,2);
 assert.equal(v.officialNumericVelocityMmYr,null);
 assert.equal(v.allowsAssetDecision,false);
 assert.throws(()=>sourceReadiness({...bridge,operatorPriorityAllowed:true}),/must not issue asset risk/);
});
