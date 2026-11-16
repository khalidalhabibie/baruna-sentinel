import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");

test("Workspace is map-first and shows actual study records, not fake asset dots",()=>{
 const home=read("src/why-sentinel.js");
 assert.match(home,/validateHistoricalFieldEvidence/);
 assert.match(home,/bf-workspace/);
 assert.match(home,/bf-region-map/);
 assert.match(home,/leaflet|L\.map|window\.L\.map/);
 assert.match(home,/selectedId="west-breakwater"/);
 assert.match(home,/baruna:select-sector/);
 assert.match(home,/Bukti belum cukup/);
 assert.match(home,/belum ada geometri|geometri sektor|polygon sektor/i);
 assert.doesNotMatch(home,/bs-mission|ws-fact-strip/);
});
test("Guide lives on its own route without automatic popup or browser completion state",()=>{
 const html=read("index.html"),nav=read("src/navigation.js"),guide=read("src/guide-page.js");
 assert.match(html,/pw-page-guide/);
 assert.match(html,/src\/guide-page\.js/);
 assert.match(html,/data-pw-page="guide"/);
 assert.doesNotMatch(html,/src\/product-onboarding\.js/);
 assert.doesNotMatch(html,/baruna-start-tour/);
 assert.match(nav,/new Set\(\["why","guide"/);
 assert.match(guide,/bg-guide-stage/);
 assert.match(guide,/validateHistoricalFieldEvidence/);
 assert.match(guide,/DATA INSUFFICIENT/);
 assert.doesNotMatch(guide,/showModal|localStorage|setTimeout/);
});
test("Source-backed assessment and synthetic-only video remain independent",()=>{
 const assessment=read("src/assessment-ui.js");
 const guide=read("src/guide-page.js");
 assert.match(assessment,/baruna:select-sector/);
 assert.match(assessment,/showSimulation=false/);
 assert.match(assessment,/DATA INSUFFICIENT/);
 assert.match(guide,/pengukuran terbaru|Survei terbaru/);
 assert.doesNotMatch(guide,/HIGH RISK|SAFE ASSET/);
});
test("Production static build includes separate guide and focus style",()=>{
 const build=read("scripts/build-static.mjs");
 assert.match(build,/product-focus\.css/);
 assert.match(build,/src\/guide-page\.js/);
 assert.doesNotMatch(build,/src\/product-onboarding\.js/);
 assert.doesNotMatch(build,/BIG_CORS_RINEX_20261115/);
});

test("Ourdo uses the true official Tail Curve wordmark, not a text imitation",()=>{
 const html=read("index.html");
 const svg=read("assets/ourdo-tail-curve-wordmark.svg");
 const build=read("scripts/build-static.mjs");
 assert.match(html,/src="\.\/assets\/ourdo-tail-curve-wordmark\.svg"/);
 assert.match(html,/class="ourdo-official-wordmark"/);
 assert.match(html,/ourdo-country-label/);
 assert.doesNotMatch(html,/<span class="ourdo-wordmark">/);
 assert.match(svg,/viewBox="0 0 620 175"/);
 assert.match(svg,/stroke="#15263A"/);
 assert.match(svg,/fill="#F36A36"/);
 assert.match(svg,/M541 136 C558 144 578 144 596 128/);
 assert.match(build,/assets\/ourdo-tail-curve-wordmark\.svg/);
});
test("Editorial map and guide styling use fewer bounded cards",()=>{
 const style=read("product-atmosphere.css");
 const build=read("scripts/build-static.mjs");
 assert.match(style,/cartographic editorial/);
 assert.match(style,/--ba-ink:#183047/);
 assert.match(style,/--ba-ocean:#14798b/);
 assert.match(style,/\.bf-workspace\{/);
 assert.match(style,/border:0!important/);
 assert.match(style,/\.bf-result-pane\{/);
 assert.match(style,/position:absolute!important/);
 assert.match(style,/\.bg-guide-stage\{/);
 assert.match(build,/product-atmosphere\.css/);
});
