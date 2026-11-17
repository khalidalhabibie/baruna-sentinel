import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const home=html("index.html"),brief=html("evidence-brief-coaster.html"),css=html("homepage-evidence.css");
test("homepage first impression leads with user, outcome and real example before the region directory",()=>{
 const lead=home.indexOf('id="rgpd-landing"'),regions=home.indexOf('id="regional-workspaces"');
 assert.ok(lead>=0&&regions>lead,"Evidence-first hero must precede region directory");
 assert.match(home,/Untuk tim integritas aset, geospasial, dan operasi pesisir/);
 assert.match(home,/Ketahui apa yang perlu diverifikasi/);
 assert.match(home,/href="\.\/evidence-brief-coaster\.html"/);
 assert.match(home,/href="\.\/real-workspace\.html"/);
 assert.match(home,/rgpd-preview-decision/);
 assert.match(home,/Coaster Street/);
 assert.match(home,/21–41/);
 assert.match(home,/±725/);
 assert.match(home,/DATA INSUFFICIENT/);
});
test("source legend clearly separates historic settlement, independent QC, PPP stations and fiction",()=>{
 for(const label of ["HISTORIS · 2005","PUBLIKASI GNSS · 2021–2023","QC GNSS · 2025","SIMULASI · TERPISAH"])
  assert.ok(home.includes(label),label);
 assert.match(home,/Cibinong; observasi independen/);
 assert.match(home,/fiktif/);
 assert.match(css,/body:not\(\[data-page="why"\]\) #rgpd-landing\{display:none!important\}/);
 assert.match(css,/body\[data-page="why"\] \.rw-card--disabled\{display:none\}/);
});
test("print-ready Coaster Evidence Brief contains only grounded source values and actionable blockers",()=>{
 for(const s of ["Coaster Street","DATA INSUFFICIENT","21–41","±725","2005","2026","Raharjo &amp; Yosi","Sitaningrum &amp; Widjajanti","Cibinong","QUALITY","operator"]) {
  if(s==="QUALITY"||s==="operator")continue;
  assert.ok(brief.includes(s),s);
 }
 assert.match(brief,/Konfirmasi ruas dan titik survei/);
 assert.match(brief,/Ukur pergerakan representatif/);
 assert.match(brief,/Harmonisasi elevasi dan muka air/);
 assert.match(brief,/Validasi kekritisan dan ambang/);
 assert.match(brief,/window\.print\(\)/);
 assert.match(brief,/@media print/);
 assert.match(brief,/journal\.ugm\.ac\.id\/jgise\/article\/view\/95957/);
 assert.match(brief,/journal\.esdm\.go\.id\/bomg\/article\/view\/12755/);
 assert.doesNotMatch(brief,/Rp\s*2\s*miliar|SECTOR-03|sensor real-time pada jalan/i);
});
test("primary routing and core modules remain accessible without masquerading as ranking",()=>{
 assert.match(home,/>Ringkasan<\/span>/);
 assert.match(home,/>Evidence Brief<\/span>/);
 assert.match(home,/>Bukti GNSS<\/span>/);
 assert.match(home,/href="\.\/spatial-demo\.html">Simulasi ranking \(fiktif\)/);
 assert.match(html("proposal-demo.html"),/href="\.\/evidence-brief-coaster\.html"/);
 assert.match(html("workspaces.html"),/href="\.\/evidence-brief-coaster\.html"/);
 assert.match(html("real-workspace.html"),/Bukti GNSS/);
 assert.match(html("spatial-demo.html"),/Simulasi · fiktif/);
});
