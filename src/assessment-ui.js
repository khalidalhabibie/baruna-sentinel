import {safeHtml as e} from "./projects.js";
import {validateHistoricalFieldEvidence} from "./historical.js";
import {parseRneu,analyzeSeries} from "./engine.js";
import {publishedCorsComparison} from "./published-cors.js";
import {inspectLocalStationEvidence,localStationEvidencePrint} from "./cors-evidence-bridge.js";
import {renderStationQc} from "./station-qc.js";
import {sourceReadiness,SITE_LOG_REFERENCES} from "./evidence-inventory.js";
import {renderAssetIntake,loadSyntheticAssetExample,importGeoJSONFile,selectImportedAsset,clearImportedAssets,downloadAssetTemplate,printableImportedAssetReport,disposeIntakeMap,renderImportedAssetMap} from "./asset-intake-ui.js";
import {
  ASSESSMENT_POLICY,assessRealProject,assessSyntheticScenario,buildAssessmentPrint
} from "./assessment.js";

const root=document.getElementById("pw-page-assessment");
let real=null;
let sourceError=null;
let selectedId="west-breakwater";
let showSimulation=false;
let assetMode=false;
let showBriefPreview=false;
let privateStationQc=null;
let privateQcError=null;
let localQcFileName="";
const measuredSources={csem:null,bako:null};
const nav=window.BarunaNavigation;
const button=(page,label,secondary=true)=>
  '<button type="button" class="pw-btn '+(secondary?'pw-btn-secondary':'pw-btn-primary')+'" data-pw-page="'+page+'">'+e(label)+'</button>';
const cell=(value,highlight=false)=>'<span'+(highlight?' class="as-accent"':'')+'>'+e(value)+'</span>';
const stateName=s=>String(s||"").replace(/_/g," ");
function sourceRows(){
 const csem=measuredSources.csem;
 const bako=measuredSources.bako;
 return [
   ["2005 field study","Tanjung Emas","Available","Historical sector observations; not current rates"],
   ["2010–2021 GPS","CSEM","Reference only",csem?
     csem.epochCount.toLocaleString("en-US")+" positions · OLS "+csem.verticalSlopeMmYr+" mm/year · descriptive station trend only":
     "Station position history; not linked to sector measurements"],
   ["2025 Multi-GNSS QC","BAKO","Reference only",bako?
     bako.epochCount+" epochs · "+bako.constellations+" constellations with pseudorange · no position solution":
     "Independent Cibinong station; not a CSEM position solution"],
   ["2026 RINEX observation QC","CSEM / CSMG",privateStationQc?"Imported locally":"Not imported",privateStationQc?
     "Private user-declared RINEX-derived epoch coverage; not a geodetic position solution":
     "Import local QC JSON in Assessment; private BIG-derived data not bundled in website"],
   ["Numeric daily position series","CSEM / CSMG","Pending official data",
     "No numeric BIG position file supplied. Time-series PDF graphics are visual context only; no 2026 velocity estimate."]
 ].map(x=>'<div class="as-source-row"><strong>'+e(x[0])+'</strong><span>'+e(x[1])+'</span><em>'+e(x[2])+'</em><small>'+e(x[3])+'</small></div>').join("");
}
function evidenceRegistry(){
 if(!real)return "";
 const bridge=privateStationQc?inspectLocalStationEvidence(privateStationQc,real,selectedId):null;
 const inventory=sourceReadiness(bridge);
 const profiles=SITE_LOG_REFERENCES.map(station=>
  '<article class="as-registry-station"><div class="as-registry-station-head"><strong>'+e(station.station)+' · '+e(station.name)+'</strong>'+
  '<span>PROFIL STASIUN / REFERENSI</span></div>'+
  '<p>Sejak '+e(station.installed)+' · receiver terakhir tercatat '+e(station.latestReceiverRecorded)+
  ' (dipasang '+e(station.latestReceiverInstalled)+')</p>'+
  '<small>'+e(station.caveat)+'</small>'+
  '<a href="'+e(station.url)+'" target="_blank" rel="noopener noreferrer">Lihat sumber BIG SRGI ↗</a></article>'
 ).join("");
 const qc=inventory.observationQc.status==="LOCAL_IMPORTED"?
  '<strong>QC OBSERVASI LOKAL TERIMPOR</strong><span>'+
   e(inventory.observationQc.dateRange.join(" – "))+' · '+inventory.observationQc.fullDayPairs+
   ' / '+inventory.observationQc.totalDays+' hari penuh di kedua stasiun</span>':
  '<strong>QC OBSERVASI MENUNGGU IMPOR</strong><span>File QC privat tidak dimasukkan ke website publik. Pilih JSON di bagian bawah untuk melihat hasil asli.</span>';
 const missing=inventory.missing.map(item=>
  '<div class="as-registry-pending"><strong>'+e(item.label)+'</strong><span>MENUNGGU DATA</span>'+
  '<p>'+e(item.detail)+'</p><small>Langkah lanjut: '+e(item.next)+'</small></div>'
 ).join("");
 return '<section class="as-evidence-registry" id="as-evidence-registry" aria-label="Inventaris bukti yang tersedia dan yang masih diperlukan">'+
   '<div class="as-registry-head"><div><span class="as-pane-label">SOURCE READINESS / BIG SRGI</span>'+
   '<h2>Data sudah tersedia, data yang masih menunggu</h2>'+
   '<p>Profil stasiun dan publikasi historis adalah referensi. Hasil QC 2026 hanya muncul setelah Anda memilih file lokal. Tidak ada nilai kosong yang diartikan sebagai 0.</p></div>'+
   '<span class="as-registry-safety">BUKAN PENILAIAN KEAMANAN ASET</span></div>'+
   '<div class="as-registry-stations">'+profiles+'</div>'+
   '<div class="as-registry-qc"><span class="as-registry-step">OBSERVASI 2026 / QC</span>'+qc+
   '<a href="#as-csem-csmg-qc">Buka impor dan rincian QC ↓</a></div>'+
   '<div class="as-registry-pending-list">'+missing+'</div>'+
   '<p class="as-registry-footnote">Site log CSEM disusun 15 Apr 2022; CSMG disusun 28 Jan 2022. Metadata menjelaskan stasiun dan perangkat, bukan solusi posisi terkini. Time series numerik belum tersedia; jangan menurunkan laju penurunan tanah dari screenshot grafik.</p></section>';
}
function privateStationQcPanel(){
  if(!real)return "";
  const local=privateStationQc;
  const decision=local?inspectLocalStationEvidence(local,real,selectedId):null;
  const state=decision?.stationCoverageState||"NOT_IMPORTED";
  const details=decision?
    '<div class="as-qc-bridge-summary">'+
      '<div><small>CSEM · file-days</small><strong>'+decision.stationDays.CSEM+'</strong></div>'+
      '<div><small>CSMG · file-days</small><strong>'+decision.stationDays.CSMG+'</strong></div>'+
      '<div><small>Matching dates</small><strong>'+decision.calendarDayPairs+'</strong></div>'+
      '<div><small>Both full days</small><strong>'+decision.full30sDayPairs+'</strong></div></div>'+
    '<div class="as-qc-archive-coverage"><div><small>CSEM · CAKUPAN EPOCH DALAM ARSIP</small><strong>'+decision.epochCoveragePercent.CSEM.toFixed(2)+'%</strong></div><div><small>CSMG · CAKUPAN EPOCH DALAM ARSIP</small><strong>'+decision.epochCoveragePercent.CSMG.toFixed(2)+'%</strong></div></div>'+
    '<p class="as-qc-archive-missing">Tanggal tanpa file CSMG dalam import: '+e(decision.missingArchiveDates.CSMG.join(", ")||"Tidak ada")+'. Cakupan arsip bukan uptime receiver atau akurasi posisi.</p>'+
    '<p class="as-qc-bridge-conclusion">Observation readiness: <b>'+e(state.replaceAll("_"," "))+
      '</b>. '+e(decision.explanation)+'</p>'+
    '<div class="as-qc-next"><strong>Keputusan untuk '+e(decision.sectorName)+
      ': minta pengukuran lapangan terbaru</strong><span>Data CORS pada tanggal yang sama membantu pemeriksaan observasi, tetapi belum mengukur sektor pelabuhan.</span></div>'+
    '<details class="as-qc-daily"><summary>Lihat rincian QC per tanggal dan konstelasi</summary><div class="as-qc-daily-inner">'+renderStationQc(decision.parsed)+'</div></details>'+'<button type="button" id="as-qc-brief" class="pw-btn pw-btn-primary">Cetak brief dengan lampiran QC lokal</button>':
    '<div class="as-qc-bridge-empty"><strong>Data CSEM–CSMG belum diimpor.</strong>'+
    '<span>Gunakan JSON hasil pemrosesan RINEX lokal. Contoh kasus Tanjung Emas dan laporan historis tetap dapat dijalankan tanpa file tersebut.</span></div>';
  return '<section class="as-qc-bridge" id="as-csem-csmg-qc" aria-label="Rangkaian QC stasiun Semarang ke brief">'+
    '<div class="as-qc-bridge-title"><div><span class="as-pane-label">P1 / GNSS OBSERVATION → ASSET VERIFICATION</span>'+
    '<h2>Cek kualitas observasi CSEM–CSMG sebelum meminta survei aset.</h2>'+
    '<p>Langkah 1. Proses file RINEX asli secara lokal. Langkah 2. Impor JSON QC ke sini. Langkah 3. Periksa tanggal pengamatan yang cocok dan cetak laporan untuk sektor pilihan.</p></div>'+
    '<div class="as-qc-import"><label class="pw-btn pw-btn-primary" for="as-qc-file">Pilih JSON QC lokal</label>'+
    '<input id="as-qc-file" class="ai-file-input" type="file" accept=".json,application/json" aria-label="Pilih berkas JSON QC CSEM dan CSMG">'+
    (local?'<button type="button" id="as-qc-clear" class="pw-btn pw-btn-secondary">Hapus dari sesi</button>':"")+
    '</div></div>'+
    '<p class="as-qc-privacy">Data lokal tidak dikirim ke server atau disimpan permanen oleh halaman ini. Format: <code>baruna-private-cors-qc-v1</code>; alat pemroses: <a href="https://github.com/khalidalhabibie/baruna-sentinel/blob/main/scripts/local_cors_qc.py" target="_blank" rel="noopener noreferrer">skrip RINEX lokal ↗</a> · <a href="https://github.com/khalidalhabibie/baruna-sentinel/blob/main/docs/P1_SEMARANG_CORS_TO_BRIEF.md" target="_blank" rel="noopener noreferrer">panduan P1 ↗</a>.</p>'+
    (privateQcError?'<p class="as-qc-bridge-error" role="alert">QC tidak diterima: '+e(privateQcError)+'</p>':"")+
    (local?'<p class="as-qc-local-file">Berkas lokal: '+e(localQcFileName)+' · status sumber: dideklarasikan pengguna, belum diverifikasi BIG</p>':"")+
    details+'</section>';
}
function publishedCorsCard(){
 const p=publishedCorsComparison();
 return '<section class="as-cors-contrast"><div class="as-cors-intro"><span class="as-pane-label">2021–2023 / PEER-REVIEWED PPP SOURCE</span><h2>Why one CORS rate cannot describe every asset</h2><p>Independent station rates from <a href="'+e(p.url)+'" target="_blank" rel="noopener noreferrer">Sitaningrum &amp; Widjajanti (2024) ↗</a>. These are published geodetic results, not live monitoring or BARUNA calculations.</p></div><div class="as-cors-metrics"><div><small>CSMG · SEMARANG GENUK</small><strong>'+p.csmg.verticalMmYr.toFixed(2)+' <span>mm/year</span></strong><em>Downward vertical movement</em></div><div><small>CSEM · SEMARANG</small><strong>+'+p.csem.verticalMmYr.toFixed(2)+' <span>mm/year</span></strong><em>Upward vertical movement</em></div></div><p class="as-cors-warning">Same study and period, different reference stations. This difference is not a velocity gradient or asset-specific risk. Do not mix these 2021–2023 PPP results with CSEM 2010–2021 descriptive OLS or BAKO 2025 QC.</p></section>';
}
function executiveDecisionCard(){
 if(sourceError||!real)return "";
 const chosen=real.records.find(x=>x.id===selectedId)||real.records[0];
 const status='<span class="as-readiness-status">Bukti untuk keputusan aset: BELUM CUKUP</span>';
 const preview=showBriefPreview?
   '<div id="as-brief-preview" class="as-brief-preview" aria-label="Contoh ringkasan verifikasi sektor historis">'+
   '<div class="as-brief-preview-head"><strong>Contoh ringkasan permintaan verifikasi</strong><span>SUMBER HISTORIS / TIDAK MENUNJUKKAN KONDISI 2026</span></div>'+
   '<dl><div><dt>Sektor</dt><dd>'+e(chosen.name)+'</dd></div>'+
   '<div><dt>Temuan sumber</dt><dd>'+e(chosen.historicRangeCm.join("–"))+' cm · penurunan kumulatif pada studi tahun 2005</dd></div>'+
   '<div><dt>Hasil pemeriksaan</dt><dd>Bukti belum cukup untuk menetapkan prioritas inspeksi operasional</dd></div></dl>'+
   '<strong class="as-brief-next-label">Tindakan yang dapat dilakukan sekarang</strong>'+
   '<ol><li>Konfirmasi ID aset, batas resmi, dan lokasi titik survei historis bersama pengelola.</li>'+'<li>Minta pengukuran ulang yang mewakili aset, lengkap dengan tanggal, datum, metode, dan ketidakpastian.</li>'+'<li>Periksa keterkaitan data stasiun GNSS dengan aset, paparan pesisir, dan tingkat penting aset.</li></ol>'+
   '<p>Ringkasan ini bersumber dari penelitian historis. Cetak laporan lengkap untuk daftar enam sektor, provenance, dan batas interpretasi.</p>'+
   '</div>':"";
 return '<section class="as-executive-decision" aria-label="Ringkasan keputusan untuk tim operasional">'+
   '<div class="as-decision-copy"><span class="as-pane-label">RINGKASAN HASIL / TANJUNG EMAS</span>'+
   '<h2>Langkah berikutnya: verifikasi pengukuran pada aset.</h2>'+
   '<p>Penelitian mencatat <strong>6 sektor historis</strong>. Untuk <strong>'+e(chosen.name)+'</strong>, terdapat catatan penurunan kumulatif '+e(chosen.historicRangeCm.join("–"))+' cm pada studi 2005. Tanpa pengukuran terbaru dan geometri terverifikasi, belum ada dasar untuk menentukan urutan inspeksi aset.</p>'+
   '<div class="as-readiness-checks"><span><b>✓</b> Catatan historis tersedia</span><span><b>!</b> Kondisi aset terbaru belum tersedia</span><span><b>!</b> Hubungan GNSS–aset belum terbukti</span></div>'+
   '</div><div class="as-executive-actions">'+status+
   '<button type="button" class="pw-btn pw-btn-primary" id="as-preview" aria-expanded="'+showBriefPreview+'" aria-controls="as-brief-preview">'+
   (showBriefPreview?"Tutup contoh brief":"Lihat contoh brief verifikasi")+'</button>'+
   '<a class="as-print-link" href="#as-export">Cetak laporan lengkap ↓</a><a class="as-print-link" href="#as-csem-csmg-qc">Lihat QC Semarang ↓</a></div>'+
   preview+'</section>';
}
function renderReal(){
 if(sourceError)return '<div class="as-error">The published source could not be validated. Assessment unavailable: '+e(sourceError)+'</div>';
 if(!real)return '<div class="as-empty">Validating published research records…</div>';
 const chosen=real.records.find(x=>x.id===selectedId)||real.records[0];
 const table=real.records.map(x=>
  '<button type="button" class="as-sector'+(x.id===chosen.id?' is-selected':'')+'" data-as-sector="'+e(x.id)+'" aria-pressed="'+(x.id===chosen.id)+'">'+
    '<span class="as-sector-title">'+e(x.name)+'</span>'+
    '<span class="as-sector-value">'+e(x.historicRangeCm.join("–"))+' cm <small>2005</small></span>'+
    '<span class="as-sector-status">Data insufficient</span>'+
  '</button>').join("");
 const evidence=chosen.evidence.map(x=>
   '<div class="as-evidence-item"><div><strong>'+e(x.label)+'</strong><small>'+e(x.detail)+'</small></div>'+
   '<span class="as-state as-state-'+(x.state==="MISSING"?"missing":x.state==="AVAILABLE"?"ready":"reference")+'">'+e(stateName(x.state))+'</span></div>').join("");
 const actions=chosen.requiredActions.map((s,i)=>
   '<li><span>'+String(i+1).padStart(2,"0")+'</span>'+e(s)+'</li>').join("");
 return executiveDecisionCard()+'<div class="as-overview-stats">'+
   '<div><small>PUBLISHED SECTORS</small><strong>'+real.records.length+'</strong><span>2005 field study</span></div>'+
   '<div><small>ASSET PRIORITIES PERMITTED</small><strong>0</strong><span>No on-asset evidence</span></div>'+
   '<div><small>VERIFICATION REQUESTS</small><strong>'+real.needsUpdatedEvidence+'</strong><span>Data gaps identified</span></div></div>'+
   '<div class="as-workflow"><div class="as-workflow-title">EVIDENCE-TO-DECISION CHAIN</div>'+
    '<div class="as-chain-item"><span class="as-chain-step">01</span><div><strong>Observed evidence</strong><small>Historical field study + separate GNSS references</small></div><b class="as-state as-state-reference">Partial</b></div>'+
    '<div class="as-chain-item"><span class="as-chain-step">02</span><div><strong>Quality &amp; linkage</strong><small>GNSS provenance present; station-to-asset link absent</small></div><b class="as-state as-state-missing">Incomplete</b></div>'+
    '<div class="as-chain-item"><span class="as-chain-step">03</span><div><strong>Spatial context</strong><small>No surveyed sector geometry or operator criticality</small></div><b class="as-state as-state-missing">Missing</b></div>'+
    '<div class="as-chain-item"><span class="as-chain-step">04</span><div><strong>Inspection decision</strong><small>Request updated field evidence; do not assign a safety rank</small></div><b class="as-state as-state-missing">Blocked</b></div>'+
   '</div>'+
   '<div class="as-section-title"><h2>Inspection screening</h2><span>Published sector records · no invented coordinates</span></div>'+
   '<div class="as-workbench">'+
     '<section class="as-select-panel"><div class="as-pane-label">SELECT AN INFRASTRUCTURE SECTOR</div>'+
       '<p>Six sectors from the original field study. Values are cumulative historic settlement, not an annual rate.</p>'+
       '<div class="as-sector-list">'+table+'</div></section>'+
     '<section class="as-decision-panel"><div class="as-pane-label">ASSESSMENT RESULT / SOURCE-BACKED</div>'+
       '<div class="as-decision-top"><div><h3>'+e(chosen.name)+'</h3>'+
       '<p>Historical reported settlement: <b>'+e(chosen.historicRangeCm.join("–"))+' cm</b> in 2005</p></div>'+
       '<span class="as-decision-status">DATA INSUFFICIENT</span></div>'+
       '<p class="as-decision-explain">'+e(chosen.explanation)+'</p>'+
       '<div class="as-pane-label as-gap-heading">EVIDENCE CHECKLIST</div><div class="as-evidence-list">'+evidence+'</div>'+
       '<div class="as-pane-label as-gap-heading">REQUIRED BEFORE OPERATIONAL PRIORITY</div>'+
       '<ol class="as-required-actions">'+actions+'</ol>'+
       '<div class="as-action-row"><button type="button" class="pw-btn pw-btn-primary" id="as-export">Export assessment brief</button>'+
         button("detail","View field records")+'</div></section>'+
   '</div>'+
   evidenceRegistry()+
   privateStationQcPanel()+
   publishedCorsCard()+
   '<section class="as-source-panel"><div class="as-source-title"><h2>GNSS and source provenance</h2>'+
      button("analyst","Open GNSS Lab")+'</div>'+
     '<div class="as-source-header"><span>SOURCE</span><span>STATION / SITE</span><span>RELATION</span><span>WHAT IT MEANS</span></div>'+
     sourceRows()+
     '<p>CSEM and BAKO are evidence sources, not independent operator projects. Neither has been linked geodetically to an individual 2005 survey sector in this prototype. The descriptive CSEM 2010–2021 OLS result must not be equated with the 2021–2023 station rates cited in the proposal: periods and processing differ.</p></section>';
}
function renderSimulation(){
 const scenario=assessSyntheticScenario();
 const policy=ASSESSMENT_POLICY;
 const list=scenario.records.map(x=>
   '<tr><th scope="row">'+e(x.name)+'</th><td>'+e(x.screeningTier)+'</td>'+
   '<td>'+(x.score===null?"—":e(x.score))+'</td>'+
   '<td>'+e(x.gateFailures.length?x.gateFailures.join(", "):x.reasons.join(" · "))+'</td></tr>').join("");
 return '<div class="as-synthetic-warning"><strong>Invented scenario — not Semarang observations</strong>'+
   '<p>Every site name, measured trend, exposure level and criticality in this exercise is synthetic. Do not use the following rankings to prioritize real inspections.</p></div>'+
   '<section class="as-simulation-rules"><div><span class="as-pane-label">ILLUSTRATIVE POLICY / NOT INDUSTRY STANDARDS</span>'+
      '<h2>Transparent priority rules</h2><p>The purpose is to demonstrate the computation and its failure states; actual thresholds must be approved by an operator and geodetic specialist.</p></div>'+
    '<div class="as-sim-formula"><span>Gate first</span><b>Geometry + site linkage + provenance + coverage + uncertainty + exposure/criticality</b>'+
    '<span>Then score (demonstration only)</span><b>Motion (0–2) + Exposure (0–2) + Criticality (0–2)</b></div></section>'+
   '<div class="as-simulation-limits"><span>Minimum span: '+policy.minimumSpanYears+' year</span>'+
    '<span>Continuity: ≥'+policy.minimumContinuityPct+'%</span>'+
    '<span>Max slope uncertainty: '+policy.maximumSlopeUncertaintyMmYr+' mm/year</span>'+
    '<span>Motion bands: '+policy.rateMediumMmYr+' / '+policy.rateHighMmYr+' mm/year</span>'+
    '<span>HIGH ≥'+policy.highScore+' · MEDIUM ≥'+policy.mediumScore+' · otherwise MONITOR</span></div>'+
   '<div class="as-simulation-table-wrap"><table class="as-simulation-table"><thead><tr><th>FICTIONAL ASSET</th><th>DEMO TIER</th><th>SCORE</th><th>EXPLAINABLE REASON / GATE</th></tr></thead>'+
    '<tbody>'+list+'</tbody></table></div>'+
   '<div class="as-simulation-footer"><p>Blocked data stays <strong>Data Insufficient</strong> even when an invented motion rate is large. Poor-quality evidence must never be interpreted as stability.</p>'+
   '<button type="button" class="pw-btn pw-btn-secondary" id="as-export">Export synthetic policy annex</button></div>';
}
function render(){
 if(!root)return;
 disposeIntakeMap();
 const selectedProject=nav?.getProject?.()||"semarang-port";
 if(selectedProject!=="semarang-port"){
  root.innerHTML='<div class="pw-breadcrumb"><button type="button" data-pw-page="projects">Projects</button><span>/</span> Assessment</div>'+
  '<div class="pw-heading-row"><div><span class="pw-kicker">SCOPE CHECK</span><h1>Assessment</h1>'+
  '<p>The selected workspace is a standalone GNSS reference or local draft, not a verified infrastructure asset project. No inspection ranking can be generated from it.</p></div></div>'+
  '<section class="pw-panel"><h2>Select the Tanjung Emas research case</h2><p>The published sector data and evidence-gate workflow are associated with that case only. Reference stations are examined in GNSS Lab.</p>'+
  '<button id="as-open-semarang" class="pw-btn pw-btn-primary" type="button">Open Tanjung Emas assessment</button></section>';return;
 }
 root.innerHTML=
  '<div class="pw-breadcrumb"><button type="button" data-pw-page="projects">Projects</button><span>/</span>'+
  '<button type="button" data-pw-page="overview">Tanjung Emas / Semarang</button><span>/</span> Assessment</div>'+
  '<div class="pw-heading-row as-page-heading"><div><span class="pw-kicker">PROPOSAL WORKFLOW / GNSS → EVIDENCE → DECISION</span>'+
     '<h1>Inspection assessment</h1><p>Explain what the research proves, what remains unknown, and whether an infrastructure inspection priority can be issued.</p></div>'+
     '<div class="pw-heading-actions">'+button("analyst","GNSS evidence")+button("compare","Compare sources")+'<a class="pw-btn pw-btn-secondary" href="./video-demo.html" style="text-decoration:none;display:inline-flex;align-items:center">Video storyboard · SIMULASI</a></div></div>'+
  '<div class="as-mode-switch" role="group" aria-label="Assessment evidence mode">'+
     '<button type="button" id="as-real-mode" aria-pressed="'+(!showSimulation&&!assetMode)+'" class="'+(!showSimulation&&!assetMode?"is-active":"")+'">Published evidence</button>'+
     '<button type="button" id="as-asset-mode" aria-pressed="'+assetMode+'" class="'+(assetMode?"is-active":"")+'">Import asset GeoJSON</button>'+
     '<button type="button" id="as-demo-mode" aria-pressed="'+showSimulation+'" class="'+(showSimulation?"is-active":"")+'">Synthetic policy demo</button>'+
     '<span>'+(assetMode?"Local geometry upload · no derived asset displacement":showSimulation?"Illustrative data only · no real site positions":"Actual 2005 study · asset risk unassessed")+'</span></div>'+
  (assetMode?renderAssetIntake():showSimulation?renderSimulation():renderReal());
  if(assetMode)requestAnimationFrame(()=>renderImportedAssetMap());
}
root?.addEventListener("click",event=>{
 const target=event.target.closest("button");
 if(!target)return;
 if(target.id==="as-open-semarang"){
  nav.selectProject("semarang-port",{page:"assessment"});return;
 }
 if(target.id==="as-real-mode"||target.id==="as-demo-mode"||target.id==="as-asset-mode"){
  showSimulation=target.id==="as-demo-mode";
  assetMode=target.id==="as-asset-mode";
  render();return;
 }
 if(target.id==="ai-example"){loadSyntheticAssetExample();render();return;}
 if(target.id==="ai-clear"){clearImportedAssets();render();return;}
 if(target.id==="ai-template"){downloadAssetTemplate();return;}
 if(target.dataset.aiAsset){if(selectImportedAsset(target.dataset.aiAsset))render();return;}
 if(target.id==="ai-print"){
  const printRegion=document.getElementById("print-report");
  printRegion.innerHTML=printableImportedAssetReport();
  window.print();return;
 }
 if(target.id==="as-qc-clear"){privateStationQc=null;privateQcError=null;localQcFileName="";render();return;}
 if(target.id==="as-qc-brief"){
  if(!privateStationQc||!real)return;
  const bridge=inspectLocalStationEvidence(privateStationQc,real,selectedId);
  const printRegion=document.getElementById("print-report");
  const report=buildAssessmentPrint({real});
  printRegion.innerHTML=report.replace(/<\/div>\s*$/,localStationEvidencePrint(bridge)+"</div>");
  window.print();return;
 }
 if(target.id==="as-preview"){showBriefPreview=!showBriefPreview;render();return;}
 if(target.dataset.asSector){
  selectedId=target.dataset.asSector;render();return;
 }
 if(target.id==="as-export"){
  if(!real)return;
  const printRegion=document.getElementById("print-report");
  printRegion.innerHTML=buildAssessmentPrint({real,scenario:showSimulation?assessSyntheticScenario():null});
  window.print();return;
 }
});
root?.addEventListener("change",async event=>{
 if(event.target.id==="as-qc-file"){
  const file=event.target.files?.[0];
  if(!file)return;
  try{
   if(file.size>3*1024*1024)throw new RangeError("QC JSON harus lebih kecil dari 3 MB");
   const obj=JSON.parse(await file.text());
   // Strict station/date/epoch validation happens in this bridge.
   inspectLocalStationEvidence(obj,real,selectedId);
   privateStationQc=obj;
   privateQcError=null;
   localQcFileName=file.name.slice(0,120);
  }catch(error){
   privateQcError=error instanceof Error?error.message:String(error);
  }
  render();
  return;
 }
 if(event.target.id!=="ai-file")return;
 const file=event.target.files?.[0];
 if(!file)return;
 await importGeoJSONFile(file);
 assetMode=true;
 render();
});
window.addEventListener("baruna:pagechange",render);
async function loadSourceMetrics(){
 const tasks=[
  async()=>{
   const r=await fetch("./data/CSEM_clean_Noff1site.source-derived.rneu");
   if(!r.ok)throw Error("CSEM source unavailable");
   const positions=parseRneu(await r.text(),{station:"CSEM",unit:"meters",referenceFrame:"user-declared"});
   const result=analyzeSeries(positions);
   if(result.station!=="CSEM"||result.epochCount<100)throw Error("CSEM source mismatch");
   measuredSources.csem=result;
  },
  async()=>{
   const r=await fetch("./data/BAKO_IGS_2025-001_20min_qc_summary.json");
   if(!r.ok)throw Error("BAKO QC source unavailable");
   const qc=await r.json();
   if(qc.status!=="VERIFIED_REAL_RINEX_OBSERVATIONS"||
      qc.source?.station!=="BAKO00IDN"||
      qc.relationshipToSemarang?.linkedToCsemMovement!==false||
      qc.audit?.epochs!==41)throw Error("BAKO QC provenance mismatch");
   measuredSources.bako={
    epochCount:qc.audit.epochs,
    constellations:qc.audit.constellationsObservedWithPseudorange.length
   };
  }
 ];
 await Promise.allSettled(tasks.map(task=>task()));
}
async function init(){
 render();
 try{
  const response=await fetch("./data/tanjung-emas-historical-field-evidence.json");
  if(!response.ok)throw Error("Published field records unavailable (HTTP "+response.status+")");
  const doc=validateHistoricalFieldEvidence(await response.json());
  real=assessRealProject(doc);
 }catch(error){sourceError=error instanceof Error?error.message:String(error);}
 await loadSourceMetrics();
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
