
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BMKG_TIDE_META,parseBmkgForecastCsv,selectBmkgWindow,forecastMetrics,wibDateKey} from "../src/bmkg-tide-adapter.js";
import {PUBLIC_CATALOG} from "../src/public-catalog-metadata.js";
const csv=readFileSync("data/bmkg-semarang-tide-forecast-20261116-20261122.csv","utf8");
test("Source-backed BMKG forecast is internally consistent",()=>{
 const records=parseBmkgForecastCsv(csv);
 const m=forecastMetrics(records);
 assert.equal(m.count,1008);
 assert.equal(m.minMslM,-0.48);
 assert.equal(m.maxMslM,0.53);
 assert.equal(records[0].utc,"2026-11-16T00:00:00.000Z");
 assert.equal(records.at(-1).utc,"2026-11-22T23:50:00.000Z");
 assert.equal(wibDateKey(records[0]),"2026-11-16");
 assert.equal(BMKG_TIDE_META.type,"FORECAST_NOT_OBSERVATION");
 assert.match(BMKG_TIDE_META.timezoneAssumption,/screenshot/);
 assert.equal(selectBmkgWindow(records,"2026-11-18").length,144);
 assert.equal(selectBmkgWindow(records,"2026-11-19").length,144);
 assert.equal(selectBmkgWindow(records,"all").length,1008);
});
test("Bad input is rejected rather than silently simulated as official",()=>{
 assert.throws(()=>parseBmkgForecastCsv(csv.replace("Date,EST,MSL,LAT","Date,FOO,MSL,LAT")),TypeError);
 assert.throws(()=>parseBmkgForecastCsv(csv.replace("2026-11-16 00:10:00","2026-11-16 00:00:00")),RangeError);
 assert.throws(()=>selectBmkgWindow([], "2031-01-01"),RangeError);
});
test("Other providers are metadata-only / not source measurements",()=>{
 assert.match(PUBLIC_CATALOG.demnas.status,/NO_DATA/);
 assert.equal(PUBLIC_CATALOG.sentinel2.products.length,3);
 assert.equal(PUBLIC_CATALOG.sentinel2.status,"CATALOGUE_METADATA_ONLY");
 assert.equal(PUBLIC_CATALOG.semarangGis.status,"PUBLIC_LAYER_METADATA_ONLY");
});
