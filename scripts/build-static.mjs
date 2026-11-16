import {mkdirSync,rmSync,copyFileSync,statSync,existsSync} from "node:fs";
import {dirname,join} from "node:path";

const publicAssets=[
  "index.html",
  "video-demo.html",
  "spatial-demo.html",
  "real-workspace.html",
  "real-workspace.css",
  "src/real-workspace.js",
  "src/real-workspace-flow.js",
  "src/real-area-analysis.js",
  "src/real-tide-context.js",
  "spatial-demo.css",
  "real-evidence.css",
  "src/real-spatial-evidence.js",
  "data/semarang-dsm-preview.json",
  "data/semarang-sentinel-scenes.json",
  "data/semarang-real-readiness.json",
  "workspaces.html",
  "workspaces.css",
  "src/spatial-demo.js",
  "src/spatial-scenario.js",
  "video-demo.css",
  "src/video-fixture.js",
  "src/synthetic-gnss-series.js",
  "src/video-demo.js",
  "src/bmkg-tide-adapter.js",
  "src/public-catalog-metadata.js",
  "data/bmkg-semarang-tide-forecast-20261116-20261122.csv",
  "data/bmkg-semarang-tide-extremes-20261116-20261122.csv",
  "styles.css",
  "project-ui.css",
  "why-sentinel.css",
  "product-experience.css",
  "product-focus.css",
  "product-atmosphere.css",
  "assets/ourdo-tail-curve-wordmark.svg",
  "src/guide-page.js",
  "src/why-sentinel-model.js",
  "src/why-sentinel.js",
  "src/projects.js",
   "src/project-workspace.js",
  "src/asset-evidence.js",
  "src/asset-intake-ui.js",
  "src/published-cors.js",
  "src/cors-evidence-bridge.js",
  "src/evidence-inventory.js",
  "src/assessment.js",
  "src/assessment-ui.js",
  "src/app.js",
  "src/navigation.js",
  "src/engine.js",
  "src/geo.js",
  "src/report.js",
  "src/historical.js",
  "src/readiness.js",
  "src/qc-source.js",
  "src/feature-flags.js",
  "src/live-map.js",
  "src/station-qc.js",
  "data/CSEM_clean_Noff1site.source-derived.rneu",
  "data/BAKO_IGS_2025-001_20min_qc_summary.json",
  "data/tanjung-emas-historical-field-evidence.json",
  "node_modules/leaflet/dist/leaflet.js",
  "node_modules/leaflet/dist/leaflet.css",
  "node_modules/leaflet/LICENSE"
];
rmSync("dist",{recursive:true,force:true});
for(const file of publicAssets){
  if(!existsSync(file)||!statSync(file).isFile()) throw new Error("Missing public asset: "+file);
  const output=join("dist",file.replace("node_modules/leaflet/dist/","vendor/leaflet/").replace("node_modules/leaflet/LICENSE","vendor/leaflet/LICENSE"));
  mkdirSync(dirname(output),{recursive:true});
  copyFileSync(file,output);
}
const leaked=[".github/workflows/ci.yml","scripts/verify_igs_rinex.py","src/engine.test.js"];
for(const path of leaked){
  if(existsSync(join("dist",path)))throw new Error("Non-public source leaked into static artifact: "+path);
}
await import("./build-standalone-spatial.mjs");
console.log("BARUNA static build completed:",publicAssets.length,"approved assets in dist/");
