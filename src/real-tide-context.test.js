import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BMKG_TIDE_META,parseBmkgForecastCsv,dailyTideContext,forecastLineSvg} from "./real-tide-context.js";

const csv=readFileSync(new URL("../data/bmkg-semarang-tide-forecast-20261116-20261122.csv",import.meta.url),"utf8");
const records=parseBmkgForecastCsv(csv);

test("BMKG observations are a source-backed forecast and WIB dates are interpreted explicitly",()=>{
 assert.equal(records.length,1008);
 assert.equal(BMKG_TIDE_META.type,"FORECAST_NOT_OBSERVATION");
 const day=dailyTideContext(records,"2026-11-18");
 assert.equal(day.dateWib,"2026-11-18");
 assert.equal(day.completeWibDay,true);
 assert.equal(day.recordCount,144);
 assert.equal(day.series.length,144);
 assert.ok(day.maxMslM>=day.minMslM);
 assert.match(day.methodologicalWarning,/Never subtract BMKG MSL tide/);
 assert.match(day.maxAtWib,/^\d{2}:\d{2}$/);
 assert.match(forecastLineSvg(day),/polyline/);
});

test("partial WIB first day is labeled partial, out-of-range date blocked",()=>{
 const first=dailyTideContext(records,"2026-11-16");
 assert.equal(first.completeWibDay,false);
 assert.ok(first.recordCount<144);
 assert.throws(()=>dailyTideContext(records,"2026-11-23"),RangeError);
});
