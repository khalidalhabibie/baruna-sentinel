import test from "node:test";
import assert from "node:assert/strict";
import {LANDMARKS,BAKO,SCENARIO_MARKERS,projectWgs84,haversineKm,renderGeoSvg,renderSpatialAuditRows,geoContextSummary,geoPointDetails,GEO_VIEWS} from "./geo.js";

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
  assert.ok(xml.includes("NO SURVEYED SECTOR GEOMETRY · NO HAZARD MODEL"));
});

test("GIS layer controls selectively hide illustrative points without hiding authentic references", () => {
  const noScenario=renderGeoSvg({fictional:false});
  assert.ok(noScenario.includes('geo-marker geo-csem'));
  assert.ok(!noScenario.includes('geo-marker geo-port"'));
  const onlyStation=renderGeoSvg({station:true,landmarks:false,fictional:false});
  assert.ok(onlyStation.includes('geo-marker geo-csem'));
  assert.ok(!onlyStation.includes('geo-marker geo-genuk-office'));
  assert.ok(!onlyStation.includes('geo-marker geo-store'));
});
test("GIS coordinate audit returns four provenance-grounded reference rows and no invented survey sector geometry", () => {
  const audit=renderSpatialAuditRows();
  assert.equal((audit.match(/<tr>/g)||[]).length,4);
  assert.ok(audit.includes("BAKO (IGS)"));
  assert.ok(audit.includes("Different station and time"));
  assert.ok(audit.includes("110.376937"));
  assert.ok(audit.includes("No on-asset GNSS link"));
  assert.ok(!audit.includes("West breakwater"));
});

test("focus presets reproject authentic WGS84 coordinates without drawing unsupported coastlines",()=>{
  const all=renderGeoSvg({fictional:false},{view:"all",selectedId:"port-terminal"});
  const port=renderGeoSvg({fictional:false},{view:"port",selectedId:"port-terminal"});
  const station=renderGeoSvg({fictional:false},{view:"station",selectedId:"csem"});
  assert.ok(all.includes('geo-marker geo-csem'));
  assert.ok(all.includes('geo-marker geo-port-terminal geo-marker-active'));
  assert.ok(!port.includes('geo-marker geo-csem'));
  assert.ok(port.includes('geo-marker geo-genuk-office'));
  assert.ok(port.includes('≈ 2 km'));
  assert.ok(station.includes('geo-marker geo-csem geo-marker-active'));
  assert.ok(!station.includes('geo-marker geo-port-terminal'));
  assert.ok(station.includes('WGS84 POINT CONTEXT'));
  assert.ok(!station.includes('<polygon'));
  assert.ok(GEO_VIEWS.port.west<GEO_VIEWS.port.east);
});
test("public source inspector never invents a geometry or current station-to-asset relationship",()=>{
  const port=geoPointDetails("port-terminal"),station=geoPointDetails("csem");
  assert.ok(port.latitude<0 && port.longitude>100);
  assert.equal(port.sourceUrl,"https://www.openstreetmap.org/node/2085925705");
  assert.equal(station.fromCsemKm,0);
  assert.ok(port.fromCsemKm>3);
  assert.match(port.limitation,/not a surveyed port-asset boundary/);
  assert.throws(()=>geoPointDetails("west-breakwater"),/Unknown public geographic reference point/);
  assert.throws(()=>geoPointDetails("fictitious-port"),/Unknown/);
});
