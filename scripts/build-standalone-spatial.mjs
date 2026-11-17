/**
 * Creates a self-contained HTML video demo, openable directly via file://.
 * No bundler, build server, network request or module import is required for
 * interactions. OSM tiles are optional; decorative context fallback is local.
 *
 * This does not include sensitive RINEX or source-backed asset measurements.
 */
import {readFileSync,writeFileSync,statSync} from "node:fs";
import {resolve} from "node:path";
const src=path=>readFileSync(resolve(path),"utf8");
const escapeScript=s=>s.replace(/<\/script/gi,"<\\/script");
let html=src("spatial-demo.html");
const css=src("dist/vendor/leaflet/leaflet.css")+"\n"+src("spatial-demo.css");
const leaflet=src("dist/vendor/leaflet/leaflet.js");
const asset=readFileSync("assets/ourdo-tail-curve-wordmark.svg");
const logo="data:image/svg+xml;base64,"+asset.toString("base64");
const assessment=src("src/assessment.js").replace(/^export\s+/gm,"");
const scenario=src("src/spatial-scenario.js")
 .replace(/^import .*?;\s*$/gm,"")
 .replace(/^export\s+/gm,"");
const app=src("src/spatial-demo.js").replace(/^import .*?;\s*$/gm,"")
 // Standalone is a synthetic-only offline video: real evidence requires published source files.
 .replace(/^\s*void initRealSpatialEvidence\(map\);\s*$/m,"")
 // A self-contained file:// demo cannot fetch the separate source-backed optical JSON.
 .replace(/^\s*void installTrueColorLayer\(map\);\s*$/m,"");
const combined=[assessment,scenario,app].join("\n;\n");
if(/^(?:import|export)\s/m.test(combined))throw new Error("Standalone JS still contains module imports/exports");
if(!html.includes('href="./vendor/leaflet/leaflet.css"')||
   !html.includes('href="./spatial-demo.css"')||
   !html.includes('src="./vendor/leaflet/leaflet.js"')||
   !html.includes('src="./src/spatial-demo.js"'))throw new Error("Video HTML dependencies have changed; update standalone bundler");
html=html.replace(' <link rel="stylesheet" href="./vendor/leaflet/leaflet.css">',"");
html=html.replace(' <link rel="stylesheet" href="./spatial-demo.css">',"");
html=html.replace(' <link rel="stylesheet" href="./real-evidence.css">',"");
html=html.replace(' <link rel="stylesheet" href="./true-color-map.css">',"");
// Offline video is intentionally simulation-only; omit inactive online map switches.
html=html.replace(/<div class="map-base-switch"[\s\S]*?<\/div>\s*<label class="basemap-opacity"[\s\S]*?<\/label>\s*<small class="satellite-source-note"[^>]*>[\s\S]*?<\/small>/m,"");
html=html.replace(' <script defer src="./vendor/leaflet/leaflet.js"></script>',"");
html=html.replace(' <script type="module" src="./src/spatial-demo.js"></script>',"");
html=html.replace(/src="\.\/assets\/ourdo-tail-curve-wordmark\.svg"/g,'src="'+logo+'"');
html=html.replace('href="./assets/ourdo-tail-curve-wordmark.svg"','href="'+logo+'"');
html=html.replace(/href="\.\/\?page=why"/g,'href="#demo-main"');
html=html.replace(/href="\.\/\?page=guide"/g,'href="https://github.com/khalidalhabibie/baruna-sentinel/blob/main/docs/SPATIAL_DEMO_VIDEO_CAPTURE.md" target="_blank" rel="noopener noreferrer"');
html=html.replace(/href="\.\/\?page=assessment"/g,'href="https://sentinel.ourdo.id/?page=assessment" target="_blank" rel="noopener noreferrer"');
html=html.replace(/href="\.\/\?page=analyst"/g,'href="https://sentinel.ourdo.id/?page=analyst" target="_blank" rel="noopener noreferrer"');
html=html.replace(/href="\.\/workspaces\.html"/g,'href="https://sentinel.ourdo.id/workspaces.html" target="_blank" rel="noopener noreferrer"');
html=html.replace(/href="\.\/spatial-demo\.html"/g,'href="#demo-main"');
html=html.replace(/href="#real-evidence"/g,'href="https://sentinel.ourdo.id/spatial-demo.html#real-evidence" target="_blank" rel="noopener noreferrer"');
html=html.replace('</head>',' <style>'+css+'</style>\n</head>');
html=html.replace('</body>',' <script>'+escapeScript(leaflet)+'</script>\n <script>'+escapeScript(combined)+'</script>\n</body>');
const dest="dist/baruna-spatial-demo-standalone.html";
writeFileSync(dest,html,"utf8");
const bytes=statSync(dest).size;
// Validate stable behavior and provenance markers, never translated UI copy.
const checks={
 "minimum HTML size":bytes>=50000,
 "visible source disclosure":html.includes('class="simulation-ribbon"'),
 "explicit simulation data mode":html.includes("SIMULATION_ONLY"),
 "interactive map":html.includes('id="spatial-map"'),
 "asset ranking":html.includes('id="ranking"'),
 "asset comparison":html.includes('id="compare-content"'),
 "verification brief":html.includes('id="brief-dialog"')&&html.includes("makeSpatialBrief"),
 "embedded Ourdo logo":html.includes("data:image/svg+xml;base64,")
};
const missing=Object.entries(checks).filter(([,passed])=>!passed).map(([name])=>name);
if(missing.length)throw new Error("Bundled offline video demo failed integrity checks: "+missing.join(", "));
console.log("Standalone single-file interactive demo:",dest,bytes,"bytes");
