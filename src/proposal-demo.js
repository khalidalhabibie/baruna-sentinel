/** BARUNA RGPD source-backed demo with a separate, overtly fictional assessment exercise. */
import {readRegistry} from './aoi-registry-model.js';
import {validateHistoricalFieldEvidence} from './historical.js';
import {validateDemoData,buildDemoDecision} from './proposal-demo-model.js';
import {verifyPublicAddendum,sectorPublicContext,historicalBenchmarkSummary} from './public-evidence-addendum.js';
import {validateIndependentBakoQc,verificationActionsForSector} from './rgpd-demo-improvements.js';
import {summarizeHistoricalCsemGps} from './csem-historical-audit.js';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtNum=v=>Number(v).toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2});
const origin=location.origin;
let csemHistorical=null,csemHistoricalIssue=null;
let source=null,study=null,decision=null,sectorId='coaster-street',areas=[],chosenAoiId='',addendum=null,addendumIssue=null,bakoQc=null,bakoQcIssue=null;
function localAreas(){
 try{return readRegistry(window.localStorage);}catch(e){$('demo-aoi-status').textContent='AOI lokal belum dapat dibaca: '+e.message;return [];}
}
function renderAoi(){
 areas=localAreas();
 const select=$('demo-aoi-select');const previous=chosenAoiId;
 select.innerHTML='<option value="">Tanpa AOI / studi wilayah</option>'+areas.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+' ('+Number(a.geometry.areaKm2).toFixed(2)+' km²)</option>').join('');
 if(areas.some(a=>a.id===previous))select.value=previous;
 else if(areas.length&&previous==='')select.value=areas[0].id;
 chosenAoiId=select.value;
 $('demo-aoi-status').innerHTML=areas.length
  ?'<strong>'+areas.length+' AOI di browser ini</strong><span>WGS84 · batas diinput pengguna · tidak diverifikasi survei</span>'
  :'<strong>Belum ada AOI lokal</strong><span>Alur GNSS dan studi historis tetap bisa didemokan tanpa AOI.</span>';
}
function renderGnss(){
 $('demo-stations').innerHTML=source.cors.stations.map(s=>{
  const movingDown=s.verticalMmYr<0;
  return '<article class="station-card '+(movingDown?'is-down':'is-up')+'"><div class="station-top"><span>'+esc(s.id)+' / '+esc(s.name)+'</span><small>HASIL PUBLIKASI / '+esc(source.cors.period)+'</small></div>'+
   '<div class="station-amount">'+(s.verticalMmYr>0?'+':'')+fmtNum(s.verticalMmYr)+' <small>± '+fmtNum(s.uncertaintyMmYr)+' mm/tahun</small></div>'+
   '<div class="station-motion">'+(movingDown?'Arah turun (negatif)':'Arah naik (positif)')+' · stasiun, bukan aset</div>'+
   '<div class="station-bar"><i style="width:'+Math.max(4,Math.min(100,Math.abs(s.verticalMmYr)/100*100))+'%"></i></div></article>';
 }).join('');
 $('demo-observations').innerHTML=source.observationEvidence.map(row=>
  '<div class="source-item"><span class="source-status '+(row.state==='INCOMPLETE'?'needs-data':'')+'">'+esc(row.state.replace(/_/g,' '))+'</span><h4>'+esc(row.label)+'</h4><small>'+esc(row.period)+'</small><p>'+esc(row.meaning)+'</p></div>').join('')+
  '<a class="source-citation" href="'+esc(source.cors.url)+'" rel="noopener noreferrer" target="_blank">Sumber publikasi Sitaningrum &amp; Widjajanti (2024) <span aria-hidden="true">↗</span></a>';
}
function renderBakoQc(){
 const el=$('demo-bako-qc');
 if(!bakoQc){el.innerHTML='<p class="qc-error">Sampel QC independen belum lolos validasi: '+esc(bakoQcIssue||'data tidak tersedia')+'. Tidak ada data pengganti.</p>';return;}
 el.innerHTML='<div class="qc-metrics">'+
  '<div><small>BAKO / CIBINONG · 1 JAN 2025</small><strong>'+esc(bakoQc.epochCount)+' <span>epoch</span></strong></div>'+
  '<div><small>RATA-RATA GPS SAJA / EPOCH</small><strong>'+fmtNum(bakoQc.gpsOnlyAverage)+'</strong></div>'+
  '<div><small>RATA-RATA MULTI-GNSS / EPOCH</small><strong>'+fmtNum(bakoQc.multiGnssAverage)+'</strong></div>'+
  '</div><p class="qc-bridge-note">6 konstelasi dengan observasi pseudorange: '+esc(bakoQc.constellations.join(', '))+'. Sampel 20 menit dari RINEX asli; '+esc(bakoQc.nonGpsEpochs)+' dari '+esc(bakoQc.epochCount)+' epoch memiliki observasi non-GPS. <b>Lebih banyak pengamatan ≠ akurasi posisi terukur.</b> BAKO berada di Cibinong, bukan CSEM/CSMG Semarang. Tidak menunjukkan laju subsidence atau pergerakan aset. <a href="'+esc(bakoQc.runUrl)+'" target="_blank" rel="noopener noreferrer">Lihat QC GitHub Actions ↗</a></p>';
}
function renderVerificationActions(){
 const result=verificationActionsForSector(sectorId,{withPublishedCoasterContext:!!addendum});
 $('demo-verification-actions').innerHTML=result.actions.map((a,i)=>
  '<div class="verification-action"><span class="verification-index">'+(i+1)+'</span><div><h4>'+esc(a.title)+'</h4><p>'+esc(a.evidence)+'</p><small>'+esc(a.owner)+' · Output: '+esc(a.deliverable)+'</small></div></div>').join('')+
  '<p class="qc-bridge-note"><strong>Evidence backlog, bukan ranking risiko.</strong> Baru bisa dipertimbangkan setelah data resmi, keterwakilan ukuran, dan kebijakan prioritas telah dinilai ahli/operator.</p>';
}
function renderRealGate(){
 const list=study.sectors;
 $('demo-sector').innerHTML=list.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.name)+'</option>').join('');
 $('demo-sector').value=sectorId;
 $('demo-gates').innerHTML=source.evidenceGates.map(g=>'<div class="gate-item"><span class="gate-icon '+(g.state==='MISSING'?'gate-missing':'gate-partial')+'">'+(g.state==='MISSING'?'!':'~')+'</span><div><strong>'+esc(g.name)+'</strong><p>'+esc(g.reason)+'</p></div><small>'+esc(g.state)+'</small></div>').join('');
}
function renderPublicAddendum(){
 const target=$('demo-public-reference'),coaster=$('demo-coaster-evidence');
 if(!addendum){
  target.innerHTML='<p class="source-unavailable">Sumber tambahan belum dapat diverifikasi: '+esc(addendumIssue||'file tidak tersedia')+'. Empat tahap utama tetap tersedia; jangan membuat data pengganti.</p>';
  coaster.innerHTML='';return;
 }
 const s=historicalBenchmarkSummary(addendum),reference=addendum.surveyReference;
 target.innerHTML='<p><strong>6 benchmark historis</strong> dari Tabel 1 Raharjo &amp; Yosi (2017), datum vertikal LWS penelitian 2004. Koordinat yang tercetak belum diaudit sebagai koordinat aset operasional.</p>'+
  '<p class="reference-warning"><b>QA: anomali sumber dikonfirmasi melalui tabel teks PDF publik.</b> TB 1–TB 2 berbeda ~103.57 satuan koordinat lokal, tetapi hanya ~0,001 m pada koordinat UTM yang dicetak. Pemeriksaan visual halaman PDF, datum, dan transformasi survei masih tertunda. Jangan memplot sebagai titik aset, mengoreksi koordinat secara asumsi, atau menghitung deformasi dari tabel ini.</p>'+
  '<div class="reference-table-wrap"><table><thead><tr><th>Benchmark</th><th>UTM X (m)</th><th>UTM Y (m)</th><th>Elevasi (m, LWS)</th></tr></thead><tbody>'+
  reference.benchmarkPoints.map(p=>'<tr><td>'+esc(p.id)+'</td><td>'+esc(p.utmXY[0])+'</td><td>'+esc(p.utmXY[1])+'</td><td>'+esc(p.elevationMReferencedToHistoricalLws)+'</td></tr>').join('')+
  '</tbody></table></div><small>Published table transcription · historical only · <a href="'+esc(s.sourceUrl)+'" target="_blank" rel="noopener noreferrer">lihat publikasi asli ↗</a></small>';
 const x=sectorPublicContext(addendum,sectorId);
 coaster.innerHTML=x?
  '<div class="coaster-context-label">STUDI TAMBAHAN / KONTEKS RUAS JALAN · 2026</div>'+
  '<p><strong>Coaster Road bagian selatan (±'+esc(x.segmentLengthMApprox)+' m).</strong> Studi tugas akhir melaporkan elevasi jalan +'+esc(x.reportedRoadElevationMlwsRangeM.join('–+'))+' mLWS dan muka air maksimum +'+esc(x.reportedMaximumSeaLevelMlwsM.toFixed(2))+' mLWS.</p>'+
  '<p>Ini adalah konteks paparan berdasarkan abstrak akademik, <b>bukan</b> data GNSS pada aset, bukti kondisi jalan terkini yang disahkan operator, perhitungan kedalaman banjir, atau prioritas inspeksi. Kecocokan ruas dengan studi 2005 belum tervalidasi.</p>'+
  '<a href="'+esc(x.sourceUrl)+'" rel="noopener noreferrer" target="_blank">Sumber: Fuan Maharani, Universitas Trisakti (2026) ↗</a>'
  :'';
}
function renderRanking(){
 const scenario=decision.syntheticAnnex;
 const tierTitle={HIGH:'TINGGI',MEDIUM:'SEDANG',MONITOR:'PANTAU',BLOCKED:'BUKTI BELUM CUKUP'};
 const cls={HIGH:'tier-high',MEDIUM:'tier-medium',MONITOR:'tier-monitor',BLOCKED:'tier-blocked'};
 $('demo-ranking').innerHTML=scenario.records.map((r,i)=>
  '<div class="rank-row"><div class="rank-id">'+String(i+1).padStart(2,'0')+'</div><div class="rank-details"><strong>'+esc(r.name)+'</strong><span>'+(r.fictionalRateMmYr===undefined?'—':esc(r.fictionalRateMmYr)+' mm/tahun')+' · fictional observation</span></div><div class="rank-score '+cls[r.tier]+'"><b>'+esc(tierTitle[r.tier]||r.tier)+'</b><small>'+(r.score===null?'GATE FAILED':r.score+'/6 POIN')+'</small></div></div>').join('');
}
function renderHistoricalCsem(){
 const el=$('demo-csem-historical');if(!el)return;
 if(!csemHistorical){el.textContent='Analisis historis belum tersedia: '+(csemHistoricalIssue||'Sumber belum dibaca')+'. Tidak diganti dengan data simulasi.';return;}
 const s=csemHistorical;
 el.innerHTML='<div class="historical-ols-grid">'+
 '<div><small>SERI GPS HISTORIS CSEM</small><strong>'+s.epochCount.toLocaleString('id-ID')+'</strong><span>epoch · '+esc(s.period)+'</span></div>'+
 '<div><small>OLS UP / DESKRIPTIF</small><strong>'+fmtNum(s.verticalSlopeMmYr)+' <em>mm/tahun</em></strong><span>Bukan laju aset atau PPP 2021–2023</span></div>'+
 '<div><small>RESIDUAL RMS</small><strong>'+fmtNum(s.residualRmsMm)+' <em>mm</em></strong><span>Bukan ketidakpastian slope</span></div>'+
 '<div><small>RENTANG ANALISIS</small><strong>'+fmtNum(s.spanYears)+' <em>tahun</em></strong><span>Jeda maksimum '+s.maxGapDays+' hari</span></div>'+
 '</div><div class="historical-ols-verdict"><strong>BATAS KESIMPULAN</strong><p>OLS pada koordinat Up historis yang sudah diproses; belum memodelkan musiman, diskontinuitas atau autokorelasi. Bukan solusi posisi multi-GNSS terkini, kondisi dermaga, atau pengujian keselamatan.</p></div>';
}
async function loadHistoricalCsem(){
 try{
  const r=await fetch('./data/CSEM_clean_Noff1site.source-derived.rneu',{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
  csemHistorical=summarizeHistoricalCsemGps(await r.text());csemHistoricalIssue=null;
 }catch(e){csemHistorical=null;csemHistoricalIssue=e.message;}
 renderHistoricalCsem();if(decision)refreshDecision();
}
function contentReport(){
 const d=decision;
 const s=d.historicalSector;
 const a=d.aoi;
 const qs=d.qualityGates;
 return '<div class="brief-h"><div><span>BARUNA / SENTINEL</span><strong>Inspection Evidence Brief</strong></div><span>OURDO INDONESIA · RGPD 2026</span></div>'+
  '<div class="brief-title"><span class="kicker">SUMBER NYATA · VERIFIKASI</span><h3>'+esc(s.name)+'</h3><p>Tanjung Emas · studi historis 2005 · keputusan tidak dapat ditetapkan dengan bukti yang ada.</p></div>'+
  '<div class="brief-status">DATA INSUFFICIENT <small>0 aset nyata bisa diberi ranking</small></div>'+
  '<div class="brief-facts"><div><small>KONTEKS HISTORIS</small><b>'+esc(s.cumulativeSettlementCm.join('–'))+' cm</b><span>Penurunan kumulatif studi 2005, bukan laju 2026</span></div>'+
  '<div><small>AOI TERPILIH</small><b>'+esc(a?.name||'Tidak dipilih')+'</b><span>'+(a?'User-declared · tidak tersurvei':'Kasus penelitian Semarang')+'</span></div>'+
  '<div><small>GNSS STASIUN</small><b>CSMG / CSEM</b><span>PPP 2021–2023 · publikasi, bukan on-asset</span></div></div>'+
  '<h4>01 / Bukti yang tersedia</h4><p>Studi lapangan historis melaporkan penurunan kumulatif pada sektor ini. Publikasi GNSS PPP 2021–2023 memberikan kecepatan vertikal pada stasiun CSMG dan CSEM, bukan pada sektor infrastruktur ini. QC RINEX 2025 di BAKO adalah referensi terpisah.</p>'+
  '<h4>02 / Kualitas dan pembatasan</h4><div class="brief-gates">'+qs.map(g=>'<span>'+esc(g.name)+' <b>'+esc(g.state)+'</b></span>').join('')+'</div>'+
  '<h4>03 / Apa yang harus diverifikasi</h4><ol>'+s.requiredActions.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ol>'+
  '<h4>03b / Urutan verifikasi data · BUKAN ranking risiko</h4><ol>'+
  verificationActionsForSector(sectorId,{withPublishedCoasterContext:!!addendum}).actions.map(a=>
  '<li><strong>'+esc(a.title)+'</strong> ('+esc(a.owner)+'): '+esc(a.evidence)+'<br>Hasil yang diminta: '+esc(a.deliverable)+'</li>').join('')+'</ol>'+
  (bakoQc?'<p><b>QC multi-GNSS independen:</b> BAKO Cibinong, 1 Jan 2025, '+esc(bakoQc.epochCount)+' epoch, enam konstelasi. Sampel RINEX untuk ketersediaan observasi; bukan hasil GNSS Semarang atau peningkatan akurasi posisi.</p>':'')+
  (csemHistorical?'<p><b>Analisis OLS CSEM oleh BARUNA:</b> '+esc(csemHistorical.epochCount)+' epoch GPS (2010–2021), slope Up deskriptif '+esc(fmtNum(csemHistorical.verticalSlopeMmYr))+' mm/tahun. Bukan multi-GNSS terkini, uncertainty slope belum tervalidasi, tidak langsung sebanding dengan PPP 2021–2023, dan bukan GNSS aset. DOI '+esc(csemHistorical.doi)+'.</p>':'')+
  '<h4>04 / Provenance dan asumsi</h4><p><b>Pengamatan CORS:</b> '+esc(d.stationPublication.source)+' · '+esc(d.stationPublication.period)+' · DOI '+esc(d.stationPublication.doi)+'.</p>'+
  '<p><b>Catatan sektor:</b> '+esc(s.source.source)+' · DOI '+esc(s.source.doi)+'.</p>'+
  (addendum?'<h4>05 / Bukti publikasi tambahan (bukan GNSS aset)</h4><p>Raharjo &amp; Yosi (2017) memuat 6 referensi benchmark historis (2004–2005) dengan QA koordinat belum selesai: pasangan TB 1/TB 2 memerlukan pemeriksaan tabel sumber.</p>':'')+
  (addendum&&sectorId==='coaster-street'?'<p>Studi Fuan Maharani (Universitas Trisakti, 2026) melaporkan konteks paparan ruas selatan Jalan Coaster ±725 m; tidak memberikan kecepatan vertikal GNSS tingkat aset atau geometri tersurvei. Sumber: '+esc(addendum.assetExposureCase.url)+'.</p>':'')+
  '<p class="brief-limits">Tidak ada pengukuran aset 2026, geometri aset resmi, atau bobot inspeksi operator. Nilai publikasi tidak diubah menjadi hasil pengukuran aset. Data simulasi disimpan terpisah.</p>';
}
function refreshDecision(){
 try{
  const a=areas.find(x=>x.id===chosenAoiId)||null;
  decision=buildDemoDecision({data:source,field:study,sectorId,aoi:a});
  const r=decision.historicalSector;
  $('demo-real-outcome').innerHTML='<div class="historic-head"><span>HISTORICAL CONTEXT · '+esc(r.year)+'</span><strong>'+esc(r.cumulativeSettlementCm.join('–'))+' <small>cm kumulatif</small></strong></div>'+
   '<p>'+esc(r.name)+' · Tidak tersedia lokasi titik survei yang tervalidasi dan pengukuran representatif terkini.</p><div class="not-ready"><b>DATA INSUFFICIENT</b><span>Prioritas inspeksi operasional belum boleh diterbitkan.</span></div>';
  renderRanking();
  renderPublicAddendum();
  renderVerificationActions();
  $('demo-print-brief').innerHTML=contentReport();
  $('demo-download').disabled=false;
  $('demo-print').disabled=false;
 }catch(error){
  decision=null;
  $('demo-real-outcome').textContent='Penilaian tidak dapat dibangun: '+error.message;
  $('demo-print-brief').textContent='Laporan tidak tersedia karena sumber tidak lolos validasi.';
  $('demo-download').disabled=true;$('demo-print').disabled=true;
 }
}
function downloadJson(){if(!decision)return;
 const record={...decision,generatedAt:new Date().toISOString(),
  publishedSecondaryContext:addendum?{
   historicalBenchmarkReference:historicalBenchmarkSummary(addendum),
   linkedCoasterRoadContext:sectorPublicContext(addendum,sectorId),
   currentAssetMeasurement:false,canIssueOperationalRank:false}:null,
  independentRinexQc:bakoQc?{...bakoQc}:null,
  historicalCsemGpsOls:csemHistorical?{...csemHistorical}:null,
  verificationBacklog:verificationActionsForSector(sectorId,{withPublishedCoasterContext:!!addendum})};
 const blob=new Blob([JSON.stringify(record,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='BARUNA_RGPD_Semarang_Evidence_Brief.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
async function boot(){
 try{
  const [rs,rh]=await Promise.all(['./data/semarang-proposal-demo.json','./data/tanjung-emas-historical-field-evidence.json'].map(url=>fetch(url,{cache:'no-store'})));
  if(!rs.ok||!rh.ok)throw new Error('Sumber data JSON tidak tersedia (HTTP '+rs.status+'/'+rh.status+').');
  source=validateDemoData(await rs.json());
  study=validateHistoricalFieldEvidence(await rh.json());
  try{
   const response=await fetch('./data/tanjung-emas-published-evidence-addendum.json',{cache:'no-store'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   addendum=verifyPublicAddendum(await response.json());
  }catch(error){addendum=null;addendumIssue=error.message;}
  try{
   const qcRes=await fetch('./data/BAKO_IGS_2025-001_20min_qc_summary.json',{cache:'no-store'});
   if(!qcRes.ok)throw new Error('HTTP '+qcRes.status);
   bakoQc=validateIndependentBakoQc(await qcRes.json());
  }catch(error){bakoQc=null;bakoQcIssue=error.message;}
  renderAoi();renderGnss();renderBakoQc();renderRealGate();refreshDecision();
  void loadHistoricalCsem();
  $('demo-aoi-select').addEventListener('change',e=>{chosenAoiId=e.target.value;refreshDecision();});
  $('demo-sector').addEventListener('change',e=>{sectorId=e.target.value;refreshDecision();});
  $('demo-download').addEventListener('click',downloadJson);
  $('demo-print').addEventListener('click',()=>{if(decision)window.print();});
  window.addEventListener('pageshow',event=>{if(event.persisted){renderAoi();refreshDecision();}});
 }catch(error){
  for(const id of ['demo-stations','demo-observations','demo-real-outcome','demo-ranking','demo-print-brief'])$(id).innerHTML='<p class="load-error">Sumber penelitian tidak bisa diverifikasi: '+esc(error.message)+'. Tidak ada hasil simulasi yang menggantikan sumber gagal.</p>';
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else void boot();