import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("decision-first navigation simplifies the product and retains advanced pages",()=>{
 const html=read("index.html");
 for(const page of ["why","projects","assessment","analyst","overview","detail","compare"])
  assert.match(html,new RegExp('data-pw-page="'+page+'"'));
 assert.match(html,/baruna-start-tour/);
 assert.match(html,/src\/product-onboarding\.js/);
 assert.match(html,/product-experience\.css/);
 assert.match(html,/baruna-more-menu/);
});
test("product tour is small, replayable, persists completion and respects evidence boundaries",()=>{
 const tour=read("src/product-onboarding.js");
 for(const name of ["Kenali misinya","Pilih sektor","Periksa hasil","Telusuri GNSS","Tentukan tindakan"])assert.ok(tour.includes(name));
 assert.match(tour,/localStorage\.setItem/);
 assert.match(tour,/data-baruna-tour-replay/);
 assert.match(tour,/aria-modal/);
 assert.match(tour,/aria-label/);
 assert.match(tour,/Escape/);
 assert.match(tour,/DATA INSUFFICIENT/);
 assert.match(tour,/bukan kondisi tahun 2026/);
});
test("case-first home and assessment use source-gated outcomes, no fictional risk scores",()=>{
 const why=read("src/why-sentinel.js");
 const assessment=read("src/assessment-ui.js");
 assert.match(why,/bs-mission/);
 assert.match(why,/74–140 cm/);
 assert.match(why,/2005/);
 assert.match(why,/DATA INSUFFICIENT/);
 assert.match(assessment,/as-orientation/);
 assert.match(assessment,/Evidence Gate/);
 assert.match(assessment,/Export assessment brief/);
 assert.ok(!why.includes("current asset risk score"));
});
test("static build includes the tour without bundling private GNSS material",()=>{
 const build=read("scripts/build-static.mjs");
 assert.match(build,/product-experience\.css/);
 assert.match(build,/src\/product-onboarding\.js/);
 assert.doesNotMatch(build,/BIG_CORS_RINEX_20261115/);
});
