import {VIDEO_CONTEXT,VIDEO_ASSETS,VIDEO_SOURCES,SOURCE_STATUS,validateVideoSources} from "./video-fixture.js";
import {parseStationQc} from "./station-qc.js";
import {makeSyntheticEnu,ENU_DEMO_CONTRACT,ENU_DEMO_STATIONS} from "./synthetic-gnss-series.js";
import {BMKG_TIDE_META,parseBmkgForecastCsv,selectBmkgWindow,forecastMetrics,wibTimeLabel} from "./bmkg-tide-adapter.js";
import {PUBLIC_CATALOG} from "./public-catalog-metadata.js";
validateVideoSources();

const root=document.getElementById("video-scene");
const stepButtons=[...document.querySelectorAll("[data-step]")];
const prev=document.getElementById("prev-scene");
const next=document.getElementById("next-scene");
const titles=["konteks wilayah","sektor contoh","verification brief"];
let scene=0;
let selectedAsset=VIDEO_ASSETS[0].id;
let selectedEnuStation="CSEM";
let selectedTideWindow="2026-11-18";
let tideRecords=null;
let tideLoadState="LOADING";
let tideLoadError="";
let importedQC=null;
let importName="";
let importError="";
const e=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=x=>Number(x).toLocaleString("id-ID",{maximumFractionDigits:2});
function provenance(status){
 if(status===SOURCE_STATUS.LOCAL)return '<span class="status local">IMPOR LOKAL</span>';
 if(status===SOURCE_STATUS.PENDING)return '<span class="status pending">BELUM ADA DATA</span>';
 if(status===SOURCE_STATUS.FORECAST)return '<span class="status source-backed">BMKG · PRAKIRAAN</span>';
 if(status===SOURCE_STATUS.CATALOGUE)return '<span class="status catalogue">METADATA RESMI</span>';
 return '<span class="status mocked">SIMULASI SAJA</span>';
}
function qcSummary(){
 if(!importedQC)return null;
 const expected=importedQC.calendar.length*2880;
 const station=name=>{
  const days=importedQC.records.filter(r=>r.station===name);
  const epochs=days.reduce((n,r)=>n+r.epochs,0);
  return {days:days.length,pct:expected?+(epochs/expected*100).toFixed(2):null};
 };
 return {
  csem:station("csem"),csmg:station("csmg"),
  shared:importedQC.jointFullDays.length,
  period:importedQC.firstDate+" — "+importedQC.lastDate,
  missingCSMG:importedQC.calendar.filter(d=>!importedQC.lookup.has("csmg|"+d.date)).map(d=>d.date)
 };
}
function sourceCard(src){
 let description=src.next;
 if(src.id==="cors"&&importedQC)description="JSON observasi privat sudah diimpor untuk sesi ini; bukan sertifikat BIG.";
 if(src.id==="tide")description=tideRecords?"1.008 data prakiraan BMKG, MSL; UTC diasumsikan dari screenshot pengaturan portal.":tideLoadState==="LOADING"?"Memuat CSV prakiraan BMKG...":"CSV belum berhasil dimuat; grafik fallback simulasi.";
 return '<article class="source-item"><div class="source-top"><div><small>'+e(src.provider)+'</small><h3>'+e(src.title)+'</h3></div>'+provenance(src.id==="tide"&&!tideRecords?SOURCE_STATUS.SYNTHETIC:src.status)+'</div>'+
 '<p>'+e(src.role)+'</p><div class="source-footer"><span>'+e(description)+'</span><a href="'+e(src.source||"#demo-missing-asset")+'" '+(src.source?'target="_blank" rel="noopener noreferrer"':'aria-disabled="true" tabindex="-1"')+'>'+
 (src.source?"Sumber ↗":"Belum ada sumber")+'</a></div></article>';
}
function stationPanel(){
 const q=qcSummary();
 return '<div class="panel station-panel"><div class="panel-header"><div><span class="panel-kicker">PRIVATE CORS OBSERVATION QC</span>'+
 '<h2>CSEM / CSMG — kondisi data</h2><p>Data asli baru terlihat setelah JSON QC diimpor dari komputer. Arsip RINEX tidak dikirim ke server.</p></div>'+
 '<label class="import-btn" for="demo-qc-file">Impor JSON QC lokal</label>'+
 '<input id="demo-qc-file" type="file" accept=".json,application/json" hidden></div>'+
 (q?'<div class="metrics"><div><small>CSEM · CAKUPAN EPOCH</small><strong>'+fmt(q.csem.pct)+'%</strong></div>'+
 '<div><small>CSMG · CAKUPAN EPOCH</small><strong>'+fmt(q.csmg.pct)+'%</strong></div>'+
 '<div><small>HARI PENUH / KEDUA STASIUN</small><strong>'+q.shared+'/'+importedQC.calendar.length+'</strong></div></div>'+
 '<p class="data-provenance"><b>DATA IMPOR LOKAL</b> '+e(importName)+' · '+e(q.period)+
 ' · tanggal CSMG tanpa file dalam arsip: '+e(q.missingCSMG.join(", ")||"tidak ada")+
 '. Cakupan timestamp bukan ketelitian posisi, tren subsiden atau uptime perangkat.</p>'+
 '<button class="link-button" type="button" id="clear-qc">Hapus QC dari sesi</button>':
 '<div class="qc-empty"><strong>Belum ada JSON QC lokal</strong>'+
 '<p>QC BIG yang sudah Anda olah tersimpan privat. Impor hasil olahan untuk menampilkan angka asli. Kami tidak mengisi angka pengganti.</p>'+
 '<span>DATA ASLI BELUM DIMUAT · BUKAN 0%</span></div>')+
 (importError?'<div role="alert" class="import-error">'+e(importError)+'</div>':"")+'</div>';
}
function syntheticEnuChart(records,component,title){
 const w=760,h=106,left=52,right=14,top=12,bottom=22;
 const vals=records.map(p=>p[component]),low=Math.min(...vals)-1.5,high=Math.max(...vals)+1.5;
 const px=i=>left+(w-left-right)*i/(records.length-1);
 const py=v=>top+(h-top-bottom)*(1-(v-low)/(high-low));
 const path=vals.map((v,i)=>(i?"L":"M")+px(i).toFixed(1)+","+py(v).toFixed(1)).join(" ");
 const grid=[0,.5,1].map(frac=>{
  const y=top+(h-top-bottom)*frac;
  return '<line x1="'+left+'" y1="'+y+'" x2="'+(w-right)+'" y2="'+y+'" stroke="#dbe9e3" stroke-dasharray="3 5"/>'+
   '<text x="'+(left-7)+'" y="'+(y+3)+'" text-anchor="end" font-size="9" fill="#7f9c91">'+((high-(high-low)*frac).toFixed(1))+'</text>';
 }).join("");
 const yearLines=[0,12,24,36,48].map(i=>'<text x="'+px(i)+'" y="'+(h-5)+'" text-anchor="middle" font-size="9" fill="#879e95">'+records[i].month.slice(0,4)+'</text>').join("");
 return '<div class="enu-row"><span class="enu-axis-label">'+e(title)+' <small>mm*</small></span>'+
  '<svg role="img" aria-label="'+e(title)+' — sintetis, bukan pengukuran BIG" class="enu-plot" viewBox="0 0 '+w+' '+h+'">'+grid+
  '<path d="'+path+'" fill="none" stroke="#18796e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'+yearLines+'</svg></div>';
}
function syntheticEnuPanel(){
 const points=makeSyntheticEnu(selectedEnuStation);
 return '<section class="panel synthetic-enu-panel">'+
  '<div class="panel-header"><div><span class="panel-kicker">VISUALISASI KONSEP / TIDAK ADA CSV RESMI</span>'+
  '<h2>GNSS Coordinate Time Series — contoh ENU</h2>'+
  '<p>Januari 2022–Oktober 2026 · '+ENU_DEMO_CONTRACT.count+' titik bulanan buatan · bukan solusi posisi harian BIG.</p></div>'+
  '<span class="status mocked">SIMULASI DATA KOORDINAT</span></div>'+
  '<div class="enu-tabs" role="group" aria-label="Pilih stasiun simulasi">'+ENU_DEMO_STATIONS.map(s=>
    '<button type="button" class="enu-tab'+(s===selectedEnuStation?' is-selected':'')+'" data-enu-station="'+s+'" aria-pressed="'+(s===selectedEnuStation?'true':'false')+'">'+s+'</button>'
   ).join("")+'</div>'+
  '<div class="enu-plots">'+syntheticEnuChart(points,"east","EAST (E)")+
  syntheticEnuChart(points,"north","NORTH (N)")+syntheticEnuChart(points,"up","UP (U)")+'</div>'+
  '<p class="enu-warning"><strong>*DATA SINTETIS / VIDEO ONLY.</strong> Angka dan pola dibuat secara algoritmik; tidak diambil dari BIG atau hasil olahan RINEX. '+ 
  'Grafik ini tidak digunakan untuk menghitung tren penurunan tanah, kecepatan gerak stasiun, risiko maupun keputusan aset. CSV resmi belum bisa diunduh.</p></section>';
}
function sourcesScene(){
 return '<div class="scene-head"><div><span class="scene-index">01 / 04 · SOURCE READINESS</span><h2>Semua sumber dicatat. Tidak semua sumber sudah tersedia.</h2>'+
 '<p>Mulai dari bukti yang dapat ditelusuri, bukan dashboard yang berpura-pura semua data sudah lengkap.</p></div>'+
 '<span class="scene-mark">Bukti → konteks → verifikasi</span></div>'+
 stationPanel()+syntheticEnuPanel()+
 '<section class="panel"><div class="panel-header"><div><span class="panel-kicker">INPUT PROVIDERS</span><h2>Sumber lingkungan & aset</h2>'+
 '<p>Warna dan status memperlihatkan sumber nyata, data yang masih kosong, dan data ilustratif.</p></div></div>'+
 '<div class="sources-grid">'+VIDEO_SOURCES.filter(x=>x.id!=="cors").map(sourceCard).join("")+'</div></section>';
}
function lineChart(values, width=440, height=165, label="Grafik ilustrasi"){
 const min=Math.min(...values),max=Math.max(...values),den=Math.max(.001,max-min);
 const points=values.map((v,i)=>[24+(width-48)*i/Math.max(1,values.length-1),
  24+(height-48)*(1-(v-min)/den)]);
 const path=points.map(([x,y],i)=>(i?"L":"M")+x.toFixed(1)+","+y.toFixed(1)).join(" ");
 const guide=[0,1,2,3].map(i=>'<line x1="24" y1="'+(24+i*(height-48)/3)+'" x2="'+(width-24)+'" y2="'+(24+i*(height-48)/3)+'" stroke="#dfe9e6" stroke-dasharray="3 7" />').join("");
 return '<svg role="img" aria-label="'+e(label)+'" viewBox="0 0 '+width+' '+height+'" class="data-plot" preserveAspectRatio="xMidYMid meet">'+guide+
 '<path d="'+path+'" fill="none" stroke="#14766c" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'+
 points.map(([x,y])=>'<circle cx="'+x+'" cy="'+y+'" r="3.5" fill="#14766c" stroke="white" stroke-width="2"/>').join("")+'</svg>';
}

function tideForecastChart(rows){
 const width=680,height=202,left=42,right=16,top=16,bottom=31,min=-0.6,max=0.65;
 const x=i=>left+(width-left-right)*(i/Math.max(1,rows.length-1));
 const y=v=>top+(height-top-bottom)*(1-(v-min)/(max-min));
 const guide=[-0.5,0,0.5].map(v=>'<line x1="'+left+'" x2="'+(width-right)+'" y1="'+y(v).toFixed(1)+'" y2="'+y(v).toFixed(1)+'" stroke="'+(v===0?'#b59c7d':'#e5ebe8')+'" stroke-dasharray="'+(v===0?'5 5':'3 6')+'"/><text x="'+(left-8)+'" y="'+(y(v)+3).toFixed(1)+'" text-anchor="end" font-size="10" fill="#7a8e86">'+v.toFixed(1)+'</text>').join("");
 const path=rows.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(r.mslM).toFixed(1)).join(' ');
 const labels=selectedTideWindow==="all"?[0,144,288,432,576,720,864,1007].map(i=>({i,label:rows[i]?.utc.slice(5,10)})):[0,36,72,108,rows.length-1].map(i=>({i,label:wibTimeLabel(rows[i])}));
 const ticks=labels.filter(v=>v.label).map(({i,label})=>'<text x="'+x(i).toFixed(1)+'" y="'+(height-8)+'" fill="#79968c" font-size="10" text-anchor="middle">'+e(label)+'</text>').join("");
 return '<svg class="tide-source-plot" role="img" aria-label="Grafik data prakiraan pasut BMKG Semarang, bukan observasi aktual" viewBox="0 0 '+width+' '+height+'">'+guide+
 '<path d="'+path+'" stroke="#14766c" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'+ticks+'</svg>';
}
function tidePanel(){
 if(tideLoadState==="LOADING")return '<div class="tide-loading">Memuat data prakiraan BMKG yang disimpan bersama demo...</div>';
 if(!tideRecords){
  return '<div class="tide-fallback"><span class="source-fallback">FALLBACK / SIMULASI VIDEO</span>'+
   lineChart(VIDEO_CONTEXT.tide.values,440,160,"Kurva pasut sintetis, CSV BMKG tidak termuat")+
   '<p class="chart-note">File forecast BMKG gagal dimuat. Grafik ini sepenuhnya simulasi. '+e(tideLoadError)+'</p></div>';
 }
 const records=selectBmkgWindow(tideRecords,selectedTideWindow),metric=forecastMetrics(records);
 const options=[["2026-11-18","18 Nov · WIB"],["2026-11-19","19 Nov · WIB"],["all","Seluruh seri · UTC"]].map(([v,label])=>
  '<button type="button" data-tide-window="'+v+'" class="tide-day'+(selectedTideWindow===v?' is-selected':'')+'" aria-pressed="'+(selectedTideWindow===v?'true':'false')+'">'+e(label)+'</button>').join("");
 return '<div class="tide-days" role="group" aria-label="Periode pasut">'+options+'</div>'+
 '<div class="tide-mini-stats">'+
 '<div><small>Minimum MSL</small><strong>'+metric.minMslM.toFixed(2)+' <small>m</small></strong></div>'+
 '<div><small>Maksimum MSL</small><strong>+'+metric.maxMslM.toFixed(2)+' <small>m</small></strong></div>'+
 '<div><small>Titik data</small><strong>'+metric.count+'</strong></div></div>'+
 tideForecastChart(records)+
 '<div class="real-source-note"><strong>DATA EKSPOR BMKG / PRAKIRAAN, BUKAN OBSERVASI.</strong> Stasiun Semarang · MSL · interval 10 menit · '+
 '16–22 November 2026 UTC (16 Nov 07:00 sampai 23 Nov 06:50 WIB). CSV tanpa timezone; UTC diinterpretasikan dari screenshot pengaturan saat unduh. '+
 '<a href="'+e(BMKG_TIDE_META.sourcePage)+'" target="_blank" rel="noopener noreferrer">Sumber BMKG</a>. Tidak digunakan untuk menyimpulkan rob atau keamanan aset.</div>';
}
function cataloguePanel(){
 const products=PUBLIC_CATALOG.sentinel2.products;
 return '<section class="panel metadata-panel"><div class="panel-header"><div><span class="panel-kicker">COPERNICUS DATA SPACE · METADATA SAJA</span>'+
 '<h2>Kandidat citra Sentinel-2 untuk Semarang</h2><p>Pencarian katalog resmi berhasil; belum ada piksel citra yang dianalisis atau dipetakan.</p></div>'+
 '<span class="status catalogue">KATALOG TERVERIFIKASI</span></div>'+
 '<div class="catalogue-grid">'+products.map(p=>'<article><small>'+e(p.date)+'</small><strong>S2 L2A · '+e(p.name.includes("S2A")?"Sentinel-2A":"Sentinel-2C")+'</strong>'+
 '<p>Cloud cover tile: '+p.tileCloudPct.toFixed(2)+'%</p><span class="catalogue-id">ID '+e(p.id.slice(0,12))+'…</span></article>').join('')+'</div>'+
 '<p class="chart-note">Persentase awan berlaku untuk produk/tile, bukan khusus lokasi aset. No InSAR processing. '+
 '<a href="https://dataspace.copernicus.eu/browser/" target="_blank" rel="noopener noreferrer">Cari di Copernicus Browser ↗</a></p></section>';
}
async function loadPublicForecast(){
 try{
  const response=await fetch(BMKG_TIDE_META.sourceCsv,{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const records=parseBmkgForecastCsv(await response.text());
  tideRecords=records;
  tideLoadState="READY";
  tideLoadError="";
 }catch(error){
  tideRecords=null;
  tideLoadState="FALLBACK_SIMULATION";
  tideLoadError=error instanceof Error?error.message:String(error);
 }
 render();
}

function contextScene(){
 return '<div class="scene-head"><div><span class="scene-index">02 / 04 · CONTEXT LAYERS</span><h2>Konteks wilayah. Bukan diagnosis penurunan tanah.</h2>'+
 '<p>Contoh bagaimana elevasi, pasut, rob, dan citra satelit akan dipetakan ke dalam satu review.</p></div>'+
 '<span class="scene-mark mock">'+(tideRecords?"BMKG PRAKIRAAN + SIMULASI":"DATA KONTEKS SIMULASI")+'</span></div>'+
 '<div class="context-grid"><article class="panel context-card">'+
 '<div class="panel-header"><div><span class="panel-kicker">BIG DEMNAS / ELEVASI</span><h2>Profil elevasi contoh</h2></div>'+provenance(SOURCE_STATUS.SYNTHETIC)+'</div>'+
 lineChart(VIDEO_CONTEXT.elevation.profile,440,160,"Ilustrasi profil elevasi, bukan raster BIG")+
 '<p class="chart-note">Nilai contoh ('+e(VIDEO_CONTEXT.elevation.unit)+'). Belum mengunduh atau memotong raster DEMNAS untuk area aset.</p>'+
 '</article><article class="panel context-card"><div class="panel-header"><div><span class="panel-kicker">BMKG / SEMARANG</span><h2>Pasut — prakiraan MSL</h2></div>'+
 provenance(tideRecords?SOURCE_STATUS.FORECAST:SOURCE_STATUS.SYNTHETIC)+'</div>'+
 tidePanel()+'</article></div>'+
 '<div class="context-strip"><article><span>PEMKOT SEMARANG</span><strong>Layer rob & drainase</strong><small>Preview ilustratif — belum memuat geometri sumber</small></article>'+
 '<article><span>COPERNICUS</span><strong>Sentinel-2 catalogue</strong><small>3 produk L2A ditemukan · citra belum diproses · InSAR tidak dihitung</small></article>'+
 '<article><span>BIG SRGI</span><strong>Koordinat harian stasiun</strong><small>Grafik ENU simulasi ada di Scene 01; estimasi vertikal asli belum tersedia</small></article></div>'+
 cataloguePanel()+'<p class="context-disclaimer">'+e(VIDEO_CONTEXT.disclaimer)+'</p>';
}
function scheme(){
 return '<svg class="schematic" role="img" aria-label="Schematic fictional coastal facility layout, not a real port map" viewBox="0 0 600 330" preserveAspectRatio="xMidYMid meet">'+
 '<rect width="600" height="330" fill="#edf3f1"/><path d="M0 267C105 241 170 295 270 259S449 263 600 222V330H0Z" fill="#c9e0dd"/>'+
 '<path d="M0 285C105 262 175 305 275 275S450 273 600 241" fill="none" stroke="#8ebeba" stroke-width="2"/>'+
 '<rect x="68" y="70" width="470" height="168" rx="13" fill="#f9fbfa" stroke="#cad9d5"/>'+
 '<path d="M73 108H530M73 152H530M73 196H530" stroke="#e5ece9" stroke-dasharray="5 8"/>'+
 '<path d="M210 74V236M378 74V236" stroke="#e5ece9" stroke-dasharray="5 8"/>'+
 VIDEO_ASSETS.map((a,i)=>{
 const sel=a.id===selectedAsset;
 return '<g><circle cx="'+a.position.x+'" cy="'+a.position.y+'" r="'+(sel?24:20)+'" fill="'+(sel?"#0f6d65":"#4c9187")+'" stroke="#fff" stroke-width="4"/>'+
 '<text x="'+a.position.x+'" y="'+(a.position.y+5)+'" fill="white" font-weight="800" font-size="15" text-anchor="middle">'+(i+1)+'</text>'+
 '<text x="'+a.position.x+'" y="'+(a.position.y-34)+'" fill="#51726a" font-size="11" text-anchor="middle">'+e(a.id)+'</text></g>';
 }).join("")+
 '<text x="29" y="306" fill="#55756e" font-size="11" font-weight="700">DIAGRAM FIKTIF / BUKAN PETA GEOREFERENSI</text>'+
 '</svg>';
}
function assetScene(){
 const asset=VIDEO_ASSETS.find(x=>x.id===selectedAsset)||VIDEO_ASSETS[0];
 return '<div class="scene-head"><div><span class="scene-index">03 / 04 · FICTIONAL ASSET CONTEXT</span><h2>Pilih sektor. Periksa apa yang belum dibuktikan.</h2>'+
 '<p>Lokasi dan nama sektor berikut hanya latihan antarmuka; bukan polygon atau kondisi aktual Pelabuhan Tanjung Emas.</p></div>'+
 '<span class="scene-mark mock">SKEMA ASET FIKTIF</span></div>'+
 '<div class="asset-layout"><section class="panel"><div class="panel-header"><div><span class="panel-kicker">NOT A GEOREFERENCED MAP</span><h2>Area ilustratif</h2></div>'+provenance(SOURCE_STATUS.SYNTHETIC)+'</div>'+
 scheme()+'</section>'+
 '<section class="panel asset-detail"><div class="panel-header"><div><span class="panel-kicker">SECTOR REVIEW · SIMULATED</span><h2>Contoh detail sektor</h2></div></div>'+
 '<div class="asset-pills">'+VIDEO_ASSETS.map(a=>'<button type="button" class="asset-pill'+(a.id===selectedAsset?" is-selected":"")+'" data-asset="'+a.id+'">'+e(a.id)+'</button>').join("")+'</div>'+
 '<span class="mock-small">CONTOH, BUKAN ASET OPERATOR</span><h3>'+e(asset.name)+'</h3>'+
 '<div class="asset-facts"><div><small>Konteks</small><strong>'+e(asset.context)+'</strong></div><div><small>Pengukuran pada aset</small><strong>Tidak tersedia</strong></div>'+
 '<div><small>Data geometri resmi</small><strong>Belum diimpor</strong></div></div>'+
 '<div class="asset-advice"><strong>Langkah verifikasi</strong><p>'+e(asset.expectedAction)+'</p></div>'+
 '</section></div>';
}
function decisionScene(){
 const a=VIDEO_ASSETS.find(x=>x.id===selectedAsset)||VIDEO_ASSETS[0];
 const q=qcSummary();
 return '<div class="scene-head"><div><span class="scene-index">04 / 04 · EXPLAINABLE OUTPUT</span><h2>Buat keputusan yang dapat dipertanggungjawabkan.</h2>'+
 '<p>Jika bukti on-site belum ada, hasil yang benar adalah meminta verifikasi — bukan mengarang klasifikasi risiko.</p></div>'+
 '<span class="scene-mark">REQUIRES VERIFICATION</span></div>'+
 '<div class="decision-layout"><section class="panel brief"><span class="panel-kicker">BARUNA / SENTINEL · VERIFICATION NOTE</span>'+
 '<h2>'+e(a.name)+'</h2><div class="result"><span>REKOMENDASI DEMO</span><strong>Memerlukan verifikasi lapangan</strong>'+
 '<p>Informasi regional dapat membantu menentukan data apa yang perlu dikumpulkan, tetapi belum cukup untuk menyatakan pergerakan, keamanan, atau prioritas operasional aset.</p></div>'+
 '<div class="brief-list"><div><b>01</b><span>Profil CSEM/CSMG</span><strong>Referensi tersedia</strong></div>'+
 '<div><b>02</b><span>QC RINEX pengguna</span><strong>'+(q?"Diimpor lokal":"Menunggu impor")+'</strong></div>'+
 '<div><b>03</b><span>BMKG Semarang · prakiraan pasut MSL</span><strong>'+(tideRecords?'Data sumber tersedia':'Fallback simulasi')+'</strong></div>'+
 '<div><b>04</b><span>DEMNAS / GIS / citra Sentinel-2</span><strong>Belum ada hasil analisis</strong></div>'+ 
 '<div><b>05</b><span>Koordinat numerik dan pengukuran aset</span><strong>Belum ada</strong></div></div>'+
 '<div class="brief-next"><strong>Tindakan berikutnya</strong><p>'+e(a.expectedAction)+'. Lengkapi datum, ketidakpastian, geometri resmi, dan persetujuan pihak berwenang.</p></div>'+
 '<div class="print-tools"><button type="button" id="print-demo" class="btn primary">Cetak contoh brief</button>'+
 '<a href="./?page=assessment">Buka Assessment berbasis bukti ↗</a></div>'+
 '</section><aside class="panel trust-panel"><span class="panel-kicker">EVIDENCE GATE</span><h2>Yang sudah diketahui dan yang belum</h2>'+
 '<div><span class="dot green"></span>Identitas dan profil stasiun BIG</div>'+
 '<div><span class="dot '+(q?"green":"amber")+'"></span>QC RINEX ('+(q?"dimuat lokal":"belum diimpor")+')</div>'+
 '<div><span class="dot '+(tideRecords?'green':'amber')+'"></span>Prakiraan BMKG ('+(tideRecords?'tersedia':'fallback demo')+')</div>'+ 
 '<div><span class="dot amber"></span>Time Series numerik resmi</div><div><span class="dot amber"></span>Geometri/pengukuran aset</div>'+
 '<div><span class="dot amber"></span>Hubungan geodesi stasiun–aset</div>'+
 '<p>Penentuan bahaya, laju penurunan tanah, dan level prioritas inspeksi <b>tidak dihitung</b> dalam mode video ini.</p>'+
 '</aside></div>';
}
function render(){
 if(!root)return;
 stepButtons.forEach((btn,i)=>{
  btn.classList.toggle("is-active",i===scene);
  if(i===scene)btn.setAttribute("aria-current","step");else btn.removeAttribute("aria-current");
 });
 root.innerHTML=[sourcesScene,contextScene,assetScene,decisionScene][scene]();
 prev.disabled=scene===0;
 next.disabled=scene===3;
 next.textContent=scene===3?"Selesai":("Lanjut: "+titles[scene]+" →");
}
document.addEventListener("click",ev=>{
 const step=ev.target.closest("[data-step]");
 if(step){scene=Number(step.dataset.step);render();return;}
 const enuSelect=ev.target.closest("[data-enu-station]");
 if(enuSelect){selectedEnuStation=enuSelect.dataset.enuStation;render();return;}
 const tideSelect=ev.target.closest("[data-tide-window]");
 if(tideSelect){selectedTideWindow=tideSelect.dataset.tideWindow;render();return;}
 const select=ev.target.closest("[data-asset]");
 if(select){selectedAsset=select.dataset.asset;render();return;}
 if(ev.target.closest("#next-scene")){scene=Math.min(3,scene+1);render();return;}
 if(ev.target.closest("#prev-scene")){scene=Math.max(0,scene-1);render();return;}
 if(ev.target.closest("#clear-qc")){
  importedQC=null;importName="";importError="";render();return;
 }
 if(ev.target.closest("#print-demo"))window.print();
});
root?.addEventListener("change",async ev=>{
 if(ev.target.id!=="demo-qc-file")return;
 const file=ev.target.files?.[0];if(!file)return;
 try{
  if(file.size>3*1024*1024)throw new RangeError("File QC JSON lebih dari batas 3 MB");
  const document=JSON.parse(await file.text());
  if(document.schema!=="baruna-private-cors-qc-v1")throw new TypeError("Skema QC tidak cocok");
  const qc=parseStationQc(document);
  if(!qc.records.some(x=>x.station==="csem")||!qc.records.some(x=>x.station==="csmg"))
   throw new TypeError("QC membutuhkan kedua stasiun CSEM dan CSMG");
  importedQC=qc;
  importName=file.name.slice(0,120);
  importError="";
 }catch(error){importError=error instanceof Error?error.message:String(error);}
 render();
});
render();
loadPublicForecast();