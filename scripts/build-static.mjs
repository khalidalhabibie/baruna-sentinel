import {mkdirSync,rmSync,copyFileSync,statSync,existsSync} from "node:fs";
import {dirname,join} from "node:path";

const publicAssets=[
  "index.html",
  "styles.css",
  "src/app.js",
  "src/engine.js",
  "src/geo.js",
  "src/report.js",
  "src/historical.js",
  "src/readiness.js",
  "src/qc-source.js",
  "data/CSEM_clean_Noff1site.source-derived.rneu",
  "data/BAKO_IGS_2025-001_20min_qc_summary.json",
  "data/tanjung-emas-historical-field-evidence.json"
];
rmSync("dist",{recursive:true,force:true});
for(const file of publicAssets){
  if(!existsSync(file)||!statSync(file).isFile()) throw new Error("Missing public asset: "+file);
  const output=join("dist",file);
  mkdirSync(dirname(output),{recursive:true});
  copyFileSync(file,output);
}
const leaked=[".github/workflows/ci.yml","scripts/verify_igs_rinex.py","src/engine.test.js"];
for(const path of leaked){
  if(existsSync(join("dist",path)))throw new Error("Non-public source leaked into static artifact: "+path);
}
console.log("BARUNA static build completed:",publicAssets.length,"approved assets in dist/");
