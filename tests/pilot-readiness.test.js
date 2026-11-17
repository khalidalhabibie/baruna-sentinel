import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const guided=read("proposal-demo.html");
const home=read("index.html");
const style=read("proposal-demo.css");
test("Bhumireka guided demo preserves the four existing scientific steps and adds a non-scoring readiness section",()=>{
 for(const anchor of ["step-aoi","step-gnss","step-decision","step-brief"])assert.match(guided,new RegExp('id="'+anchor+'"'));
 assert.equal((guided.match(/<section class="step(?: step-report)?"/g)||[]).length,4,"readiness must not be a fake fifth analysis step");
 assert.match(guided,/id="pilot-readiness"/);
 assert.ok(guided.indexOf('id="pilot-readiness"')>guided.indexOf('id="step-brief"'));
 assert.match(guided,/href="#pilot-readiness"/);
 assert.match(home,/href="\.\/proposal-demo\.html#pilot-readiness"/);
});
test("readiness truthfully separates public sources, working prototype and missing operator proof",()=>{
 const items=[...guided.matchAll(/<article class="pilot-status-card ([^"]+)">/g)];
 assert.deepEqual(items.map(m=>m[1]),["pilot-status-real","pilot-status-demo","pilot-status-missing"]);
 for(const phrase of ["studi historis","Cibinong, bukan Semarang","QC observasi RINEX BAKO 2025","Registrasi AOI lokal","DATA INSUFFICIENT","Geometri aset resmi","pengukuran berulang","kebijakan ranking","0 aset nyata"]){
  assert.ok(guided.toLowerCase().includes(phrase.toLowerCase()),"missing essential distinction: "+phrase);
 }
 assert.doesNotMatch(guided,/sudah (?:menjadi|berhasil) (?:monitoring|sistem operasional) aset/i);
});
test("scope is marked a proposed hypothesis and invites real on-site discovery",()=>{
 for(const phrase of ["1</b> AOI","3–5</b> aset","10</b> hari kerja","Hipotesis durasi","Belum ada kerja sama","baseline operator","siapa pemilik anggaran"]){
  assert.ok(guided.includes(phrase),phrase);
 }
 assert.match(style,/\.pilot-readiness-grid\{display:grid/);
 assert.match(style,/@media\(max-width:640px\)/);
 assert.match(style,/@media print\{\.pilot-readiness\{display:none!important\}/);
});
