import test from "node:test";
import assert from "node:assert/strict";
import {LANDMARKS,BAKO,SCENARIO_MARKERS,projectWgs84,haversineKm,renderGeoSvg,geoContextSummary} from "./geo.js";

test("CSEM coordinates match BIG InaCORS sexagesimal catalogue",()=>{
  const c=LANDMARKS.find(p=>p.id==="csem");
  assert.ok(Math.abs(c.lat-(-6.98726917))<0.00001);
  assert.ok(Math.abs(c.lon-110.3769372)<0.00001);
  const xy=projectWgs84(c);
  assert.ok(xy.x>0&&xy.x<1&&xy.y>0&&xy.y<1);
});
test("separate BAKO IGS station is far from Semarang; no false data linkage",()=>{
  const g=geoContextSummary();
  const c=LANDMARKS.find(p=>p.id==="csem");
  assert.ok(haversineKm(c,BAKO)>300);
  assert.equal(g.observationLinkedToMovement,false);
  assert.ok(g.landmarkDistanceKm>3 && g.landmarkDistanceKm<12);
});
test("only source-grounded reference points are marked real; scenario locations fictional",()=>{
  assert.equal(LANDMARKS.length,3);
  assert.equal(SCENARIO_MARKERS.length,3);
  assert.ok(SCENARIO_MARKERS.every(p=>p.type==="fictional"));
  const xml=renderGeoSvg();
  assert.ok(xml.includes('viewBox="0 0 940 470"'));
  assert.ok(xml.includes("fictional scenario location"));
  assert.ok(xml.includes("NO DEMNAS, COASTLINE OR HAZARD MODEL"));
});
