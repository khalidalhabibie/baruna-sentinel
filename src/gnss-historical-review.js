/**
 * BARUNA historical GNSS comparison — source-backed research, NOT live GNSS.
 * Published Table 2 values and secondary fits are different estimators.
 * Never feed these historical stations into AOI risk ranking or current motion.
 */
export const HISTORICAL_GNSS_REVIEW_SOURCE="./data/gnss-historical-csem-cpkl-review.json";
const SOURCE_DOI="10.5281/zenodo.7775016";
const STUDY_DOI="10.1038/s41597-023-02274-0";
const EXPECTED=Object.freeze({
 CSEM:Object.freeze({dateStart:"2010-01-13",dateEnd:"2021-12-31",
  epochs:3561,md5:"481e60f0a03126689721b57eecb4d281",
  published:-0.8,ols:-0.728,gap:0.072,uncertainty:0.038}),
 CPKL:Object.freeze({dateStart:"2010-11-11",dateEnd:"2021-12-31",
  epochs:3989,md5:"e0010aff455366a322da2103a43bfaa5",
  published:-107,ols:-115.938,gap:-8.938,uncertainty:0.202})
});
const isNumber=x=>typeof x==="number"&&Number.isFinite(x);
const near=(a,b)=>isNumber(a)&&Math.abs(a-b)<0.0001;
const escapeHtml=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const rate=n=>(n<0?"−":n>0?"+":"")+Math.abs(n).toLocaleString("id-ID",{minimumFractionDigits:1,maximumFractionDigits:3});
function fail(reason){throw new TypeError("GNSS historical research provenance rejected: "+reason);}

export function validateHistoricalGnssReview(raw){
 if(!raw||raw.schema!=="baruna-gnss-historical-research-comparison-v1"||
    raw.evidenceType!=="HISTORICAL_RESEARCH_DERIVED"||
    raw.historicalPeriod!=="2010–2021"||
    raw.dataYearsNot2026!==true||
    raw.scientificValidated!==false||
    raw.independentlyValidated2026Velocity!==false||
    raw.stationVelocityIsAssetRate!==false||
    raw.operationalAssetRiskRankingAvailable!==false)
  fail("research scope and scientific gate");
 const source=raw.source;
 if(source?.paperDoi!==STUDY_DOI||source?.dataDoi!==SOURCE_DOI||
    source.paperUrl!=="https://doi.org/"+STUDY_DOI||
    source.dataUrl!=="https://doi.org/"+SOURCE_DOI||
    !source.methodAuditUrl?.startsWith("https://github.com/khalidalhabibie/sentinel-helpes/blob/main/docs/")||
    source.uncertaintiesComparable!==false||
    !source.computation?.includes("annual and semiannual")||
    !source.upstreamProcess?.includes("not reprocessed raw BIG RINEX"))
  fail("study, input provenance and methodology");
 if(!Array.isArray(raw.stations)||raw.stations.length!==2||
    !Array.isArray(raw.disclaimers)||raw.disclaimers.length<3)fail("station inventory or limitations");
 const identified=new Set();
 for(const station of raw.stations){
  const expected=EXPECTED[station.id];
  if(!expected||identified.has(station.id)||
     station.sourceFile!==station.id+"_clean_Noff1site.rneu"||
     station.sourceMd5!==expected.md5||
     station.dateStart!==expected.dateStart||station.dateEnd!==expected.dateEnd||
     station.observedEpochs!==expected.epochs||
     !isNumber(station.spanYears)||station.spanYears<10||
     !near(station.publishedVerticalMmYr,expected.published)||
     !near(station.publishedUncertaintyMmYr,expected.uncertainty)||
     !near(station.reproducedSeasonalOlsVerticalMmYr,expected.ols)||
     !near(station.benchmarkGapMmYr,expected.gap)||
     !near(station.benchmarkGapMmYr,
       Math.round((station.reproducedSeasonalOlsVerticalMmYr-station.publishedVerticalMmYr)*1000)/1000)||
     !isNumber(station.reproducedLinearOlsVerticalMmYr)||
     !isNumber(station.residualRmseMm)||station.residualRmseMm<=0||
     !isNumber(station.modelHac30ObsApproxSeMmYr)||
     (station.id==="CSEM"&&station.comparisonStatus!=="CLOSE_BUT_NOT_EXACT")||
     (station.id==="CPKL"&&station.comparisonStatus!=="METHOD_DISCREPANCY_UNRESOLVED"))
   fail("station model, dataset fingerprint or fitted value");
  identified.add(station.id);
 }
 if(!identified.has("CSEM")||!identified.has("CPKL"))fail("required stations");
 return Object.freeze({
  source:Object.freeze({...source}),
  period:raw.historicalPeriod,
  stations:Object.freeze(raw.stations.map(s=>Object.freeze({...s}))),
  scientificValidated:false,
  currentYearMotionAvailable:false,
  assetRiskRankingAvailable:false,
  caveats:Object.freeze([...raw.disclaimers])
 });
}

function comparisonBars(station){
 const max=Math.max(Math.abs(station.publishedVerticalMmYr),
   Math.abs(station.reproducedSeasonalOlsVerticalMmYr));
 const make=(label,value,variant)=>{
  const width=(Math.abs(value)/max*100).toFixed(2);
  return '<div class="gnss-history-bar-row"><div class="gnss-history-bar-label">'+escapeHtml(label)+'</div>'+
   '<div class="gnss-history-bar-track"><span class="gnss-history-bar-fill '+variant+
   '" style="width:'+width+'%"></span></div>'+
   '<span class="gnss-history-bar-number">'+escapeHtml(rate(value))+'</span></div>';
 };
 return '<div class="gnss-history-bars" aria-label="Bandingkan magnitudo kecepatan vertikal historis pada stasiun yang sama">'+
   make("Publikasi",station.publishedVerticalMmYr,"is-published")+
   make("OLS BARUNA",station.reproducedSeasonalOlsVerticalMmYr,"is-reproduced")+'</div>';
}

export function renderHistoricalGnssReview(review){
 if(!review||review.scientificValidated!==false||
    review.currentYearMotionAvailable!==false||
    review.assetRiskRankingAvailable!==false||
    !Array.isArray(review.stations)||review.stations.length!==2)
   fail("untrusted render input");
 const stations=review.stations.map(station=>{
  const isMismatch=station.comparisonStatus==="METHOD_DISCREPANCY_UNRESOLVED";
  const value=rate(station.reproducedSeasonalOlsVerticalMmYr);
  return '<article class="gnss-history-card">'+
   '<div class="gnss-history-card-head"><div><span class="saas-eyebrow">STASIUN '+escapeHtml(station.id)+'</span>'+
   '<h3>'+escapeHtml(station.stationName)+'</h3></div>'+
   '<span class="gnss-history-status '+(isMismatch?'is-review':'is-near')+'">'+
    (isMismatch?'Selisih belum terselesaikan':'Mendekati publikasi')+'</span></div>'+
   '<div class="gnss-history-main"><strong>'+escapeHtml(value)+'</strong>'+
   '<span>mm/tahun <small>OLS + komponen musiman · 2010–2021</small></span></div>'+
   comparisonBars(station)+
   '<div class="gnss-history-stats"><div><span>Selisih vs publikasi</span><strong>'+
      escapeHtml(rate(station.benchmarkGapMmYr))+' mm/tahun</strong></div>'+
   '<div><span>Rentang observasi</span><strong>'+escapeHtml(station.dateStart)+' – '+escapeHtml(station.dateEnd)+'</strong></div>'+
   '<div><span>Epoch sumber</span><strong>'+station.observedEpochs.toLocaleString("id-ID")+'</strong></div></div>'+
   (isMismatch?
     '<p class="gnss-history-warning"><strong>Catatan metode:</strong> Selisih sekitar 8,9 mm/tahun belum dapat dijelaskan sepenuhnya. Jangan tampilkan hasil OLS sebagai angka resmi publikasi.</p>':
     '<p class="gnss-history-card-note">Dekat dengan benchmark penelitian, tetapi bukan pengolahan GNSS independen.</p>')+
   '</article>';
 }).join("");
 return '<div class="gnss-history-grid">'+stations+'</div>'+
  '<div class="gnss-history-foot">'+
  '<div><strong>Batas interpretasi</strong>'+
   '<p>Data terolah penelitian 2010–2021, bukan deformasi tahun 2026. Garis perbandingan dinormalisasi <em>per stasiun</em>, bukan ranking laju atau risiko antarwilayah. Nilai negatif menunjukkan gerakan vertikal turun dalam kerangka acuan penelitian.</p>'+
   '<p>Ketidakpastian publikasi dan estimasi HAC dari regresi BARUNA berasal dari metode berbeda; keduanya tidak boleh dibandingkan sebagai ukuran akurasi yang setara.</p></div>'+
  '<details class="gnss-history-details"><summary>Metode &amp; sumber data</summary>'+
   '<p>OLS linear + harmonik tahunan dan setengah tahunan pada seri GNSS yang sudah dibersihkan peneliti. Kedua file RNEU lolos checksum MD5 pada Mac operator; bukan pemrosesan ulang RINEX 2026.</p>'+
   '<div class="gnss-history-sources">'+
    '<a href="'+escapeHtml(review.source.paperUrl)+'" target="_blank" rel="noopener noreferrer">Publikasi ilmiah ↗</a>'+
    '<a href="'+escapeHtml(review.source.dataUrl)+'" target="_blank" rel="noopener noreferrer">Dataset Zenodo ↗</a>'+
    '<a href="'+escapeHtml(review.source.methodAuditUrl)+'" target="_blank" rel="noopener noreferrer">Audit &amp; perbedaan metode ↗</a>'+
   '</div></details>'+
  '</div>';
}
