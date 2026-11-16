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
const app=src("src/spatial-demo.js").replace(/^import .*?;\s*$/gm,"");
const combined=[assessment,scenario,app].join("\n;\n");
if(/^(?:import|export)\s/m.test(combined))throw new Error("Standalone JS still contains module imports/exports");
if(!html.includes('href="./vendor/leaflet/leaflet.css"')||
   !html.includes('href="./spatial-demo.css"')||
   !html.includes('src="./vendor/leaflet/leaflet.js"')||
   !html.includes('src="./src/spatial-demo.js"'))throw new Error("Video HTML dependencies have changed; update standalone bundler");
html=html.replace(' <link rel="stylesheet" href="./vendor/leaflet/leaflet.css">',"");
html=html.replace(' <link rel="stylesheet" href="./spatial-demo.css">',"");
html=html.replace(' <script defer src="./vendor/leaflet/leaflet.js"></script>',"");
html=html.replace(' <script type="module" src="./src/spatial-demo.js"></script>',"");
html=html.replace(/src="\.\/assets\/ourdo-tail-curve-wordmark\.svg"/g,'src="'+logo+'"');
html=html.replace('href="./assets/ourdo-tail-curve-wordmark.svg"','href="'+logo+'"');
html=html.replace(/href="\.\/\?page=why"/g,'href="#demo-main"');
html=html.replace(/href="\.\/\?page=guide"/g,'href="https://github.com/khalidalhabibie/baruna-sentinel/blob/main/docs/SPATIAL_DEMO_VIDEO_CAPTURE.md" target="_blank" rel="noopener noreferrer"');
html=html.replace(/href="\.\/\?page=assessment"/g,'href="https://github.com/khalidalhabibie/baruna-sentinel" target="_blank" rel="noopener noreferrer"');
html=html.replace('</head>',' <style>'+css+'</style>\n</head>');
html=html.replace('</body>',' <script>'+escapeScript(leaflet)+'</script>\n <script>'+escapeScript(combined)+'</script>\n</body>');
const dest="dist/baruna-spatial-demo-standalone.html";
writeFileSync(dest,html,"utf8");
const bytes=statSync(dest).size;
if(bytes<50000||!html.includes("DEMO SCENARIO")||!html.includes("makeSpatialBrief"))throw new Error("Bundled offline video demo appears incomplete");
console.log("Standalone single-file interactive demo:",dest,bytes,"bytes");
