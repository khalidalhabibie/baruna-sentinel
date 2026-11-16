/**
 * BARUNA Sentinel / Spatial Decision demo.
 *
 * Every polygon, asset, coordinate and observation series in this module is
 * FICTIONAL. Approximate Semarang context must not be interpreted as actual
 * measured locations of port facilities or original 2005 research sectors.
 *
 * The policy and scenario are the same deterministic, unvalidated synthetic
 * demonstration already shipped in src/assessment.js. This is NOT a second
 * independent risk model.
 */
import {ASSESSMENT_POLICY,ASSESSMENT_REASON,SYNTHETIC_SCENARIO,assessSyntheticScenario} from "./assessment.js";

export const SPATIAL_DEMO_META=Object.freeze({
  mode:"SIMULATION_ONLY",
  place:"Pesisir Semarang · area ilustratif",
  source:"BARUNA Sentinel synthetic scenario, not BIG GNSS, official asset location or operator survey",
  title:"Simulasi keputusan inspeksi",
  referenceDate:"2026-10-01",
  geographicAccuracy:"FICTIONAL_POLYGONS",
  validForAssetSafety:false,
  policyId:ASSESSMENT_POLICY.id,
  caution:"Koordinat, geometri, GNSS, eksposur, kritikalitas, dan prioritas semuanya sintetis. Tidak menggambarkan kondisi atau lokasi aset Tanjung Emas yang sebenarnya."
});

/** Polygons are deliberately schematic and must not be exported as 'real GIS'. */
const SAMPLE_GEOMETRY=Object.freeze({
  "sim-port":Object.freeze([[ -6.9441,110.4191],[-6.9441,110.4231],[-6.9473,110.4241],[-6.9481,110.4200]]),
  "sim-road":Object.freeze([[-6.9430,110.4270],[-6.9418,110.4335],[-6.9440,110.4341],[-6.9451,110.4278]]),
  "sim-store":Object.freeze([[-6.9517,110.4220],[-6.9511,110.4264],[-6.9550,110.4267],[-6.9551,110.4223]]),
  "sim-incomplete":Object.freeze([[-6.9510,110.4304],[-6.9508,110.4353],[-6.9541,110.4360],[-6.9543,110.4312]])
});

const ASSET_LABELS=Object.freeze({
 "sim-port":Object.freeze({label:"Sektor A",name:"Akses pelabuhan",type:"Jalur akses",mapLabel:"A"}),
 "sim-road":Object.freeze({label:"Sektor B",name:"Jalan pesisir",type:"Jalan operasional",mapLabel:"B"}),
 "sim-store":Object.freeze({label:"Sektor C",name:"Area penyimpanan",type:"Fasilitas logistik",mapLabel:"C"}),
 "sim-incomplete":Object.freeze({label:"Sektor D",name:"Struktur tepi air",type:"Struktur pesisir",mapLabel:"D"})
});

const STATUS=Object.freeze({
 HIGH:Object.freeze({label:"Prioritas tinggi",short:"TINGGI",color:"#c65e40",next:"Siapkan pemeriksaan terarah dan tinjau prioritas bersama operator."}),
 MEDIUM:Object.freeze({label:"Prioritas sedang",short:"SEDANG",color:"#c58b39",next:"Periksa ulang bukti dan jadwalkan verifikasi sesuai prosedur operator."}),
 MONITOR:Object.freeze({label:"Pantau berkala",short:"MONITOR",color:"#178a78",next:"Pertahankan pemantauan dan evaluasi apabila kondisi atau bukti berubah."}),
 BLOCKED:Object.freeze({label:"Bukti belum cukup",short:"PERLU DATA",color:"#657c89",next:"Lengkapi lokasi dan pengukuran yang representatif sebelum menentukan prioritas."})
});

export const DEMO_POLICY=ASSESSMENT_POLICY;
export const GATE_LABELS=Object.freeze({
 GEOMETRY:"Geometri aset belum diverifikasi",
 REPRESENTATIVENESS:"Pengukuran aset belum representatif",
 SOURCE:"Sumber atau datum belum diverifikasi",
 PERIOD:"Rentang pengamatan terlalu pendek",
 CONTINUITY:"Data observasi tidak cukup lengkap",
 UNCERTAINTY:"Ketidakpastian terlalu tinggi",
 CONTEXT:"Eksposur atau kekritisan belum tersedia"
});

export function getSpatialCases(){
 const outcome=assessSyntheticScenario();
 return outcome.records.map(result=>{
  const record=SYNTHETIC_SCENARIO.find(r=>r.id===result.id);
  const label=ASSET_LABELS[result.id];
  if(!record||!label||!SAMPLE_GEOMETRY[result.id])throw new Error("Missing synthetic visual case");
  const status=STATUS[result.screeningTier];
  if(!status)throw new Error("Unsupported synthetic screening tier");
  return Object.freeze({
   id:record.id,...label,
   sourceMode:"SYNTHETIC",
   geometry:SAMPLE_GEOMETRY[result.id],
   input:record,
   result,
   status
  });
 });
}

export function getSpatialCase(id){
 return getSpatialCases().find(item=>item.id===id) || null;
}

/** Deterministic trend-shaped values used for illustrative chart ONLY. */
export function makeSyntheticAssetSeries(item){
 if(!item||item.sourceMode!=="SYNTHETIC")throw new TypeError("Only explicit demo inputs");
 if(item.result.screeningTier==="BLOCKED")return [];
 const count=Math.round(item.input.spanYears*12)+1;
 const startYear=2026, startMonth=9-(count-1);
 return Array.from({length:count},(_,i)=>{
  const date=new Date(Date.UTC(startYear,startMonth+i,1));
  const year=date.getUTCFullYear(), month=String(date.getUTCMonth()+1).padStart(2,"0");
  const linear=item.input.verticalRateMmYr*i/12;
  const variation=1.25*Math.sin(i*.85+(item.id.length*.31))+0.45*Math.cos(i*.39);
  return Object.freeze({date:year+"-"+month,upMm:Number((linear+variation).toFixed(2))});
 });
}

export function explainSyntheticDecision(item){
 if(!item||item.sourceMode!=="SYNTHETIC")throw new TypeError("Invalid demo decision");
 if(item.result.screeningTier==="BLOCKED")return {
  headline:"Belum dapat diprioritaskan",
  summary:"Beberapa prasyarat bukti gagal. Angka pergerakan tidak boleh langsung dianggap sebagai keputusan.",
  why:item.result.gateFailures.map(k=>GATE_LABELS[k]||ASSESSMENT_REASON[k]||k)
 };
 const points=item.result.reasons;
 const trend=item.result.downwardRateMmYr;
 const motion="Laju turun contoh "+Math.round(trend)+" mm/tahun";
 const exposure="Paparan "+({high:"tinggi",moderate:"sedang",low:"rendah"}[item.input.exposure]);
 const critical="Kekritisan "+({high:"tinggi",moderate:"sedang",low:"rendah"}[item.input.criticality]);
 return {
  headline:item.status.label,
  summary:"Kelas ilustratif dihitung dari pergerakan, paparan, dan kekritisan menggunakan kebijakan demo yang belum divalidasi.",
  why:[motion,exposure,critical],
  score:item.result.score,
  points
 };
}

export function makeSpatialBrief(item,{createdAt="2026-11-16"}={}){
 const detail=explainSyntheticDecision(item);
 const rates=item.result.screeningTier==="BLOCKED"?
  "Tidak bisa dipakai sebagai laju yang memenuhi prasyarat":item.input.verticalRateMmYr+" mm/tahun (buatan)";
 const why=detail.why.map(x=>"- "+x).join("\n");
 return [
 "BARUNA SENTINEL — VERIFICATION BRIEF / DEMONSTRASI",
 "===============================================",
 "SIMULASI / DATA FIKTIF — BUKAN HASIL SURVEI ATAU REKOMENDASI OPERASIONAL",
 "Tanggal demo: "+createdAt,
 "Lokasi: Pesisir Semarang (skema ilustratif; koordinat tidak mewakili aset nyata)",
 "Aset ilustratif: "+item.label+" — "+item.name,
 "Kelas screening contoh: "+item.status.label+" ("+item.result.screeningTier+")",
 "Laju vertikal input: "+rates,
 "Kelanjutan: "+item.status.next,
 "",
 "ALASAN / KUALITAS BUKTI",
 why,
 "",
 "KONTRAK DATA",
 "Source mode: "+item.sourceMode,
 "Policy: "+ASSESSMENT_POLICY.id,
 "Skenario dan poligon dibuat untuk video; bukan hasil GNSS BIG, InSAR atau survei aset.",
 "Tidak boleh digunakan sebagai prioritas inspeksi operasional atau penilaian keselamatan.",
 "",
 "SETELAH VIDEO / DATA RESMI DIPERLUKAN",
 "- Geometri aset yang diverifikasi operator dan CRS yang benar",
 "- Seri GNSS representatif, datum, frame/epoch dan ketidakpastian",
 "- Kriteria prioritas dan criticality yang disetujui operator",
 "- Review geodesist / asset engineer sebelum keputusan nyata"
 ].join("\n");
}


/**
 * Ranking is ONLY meaningful for synthetic examples that pass all evidence
 * gates. BLOCKED items are segregated rather than assigned a misleading
 * bottom rank (or a score of zero). Equal scores share the same rank.
 */
export function getRankedSpatialCases(items=getSpatialCases()){
 if(!Array.isArray(items)||items.some(item=>item?.sourceMode!=="SYNTHETIC"))
  throw new TypeError("Ranking accepts only explicitly synthetic cases");
 const eligible=items.filter(item=>item.result.screeningTier!=="BLOCKED"&&
   item.result.gateFailures?.length===0&&Number.isFinite(item.result.score));
 const excluded=items.filter(item=>!eligible.includes(item));
 eligible.sort((a,b)=>b.result.score-a.result.score||a.id.localeCompare(b.id));
 const ranked=eligible.map((item,i)=>Object.freeze({
  item,rank:i&&item.result.score===eligible[i-1].result.score?
    eligible.slice(0,i).findIndex(x=>x.result.score===item.result.score)+1:i+1
 }));
 return Object.freeze({
  eligible:Object.freeze(ranked),
  excluded:Object.freeze(excluded.map(item=>Object.freeze({item,rank:null}))),
  eligibleCount:ranked.length,
  excludedCount:excluded.length,
  mode:"SIMULATION_ONLY",
  policyId:ASSESSMENT_POLICY.id
 });
}

/** Reuse the existing assessment calculation; do not invent a second score. */
export function getSyntheticScoreBreakdown(item){
 if(!item||item.sourceMode!=="SYNTHETIC")throw new TypeError("Synthetic case expected");
 if(item.result.screeningTier==="BLOCKED"||!Number.isFinite(item.result.score))return null;
 const reasons=item.result.reasons;
 if(!Array.isArray(reasons)||reasons.length!==3)throw new Error("Invalid assessment reason structure");
 const points=reasons.map(reason=>{
  const m=reason.match(/_(\\d+)_POINTS$/);
  if(!m)throw new Error("Score rationale is unavailable");
  return Number(m[1]);
 });
 const [motion,exposure,criticality]=points;
 if(motion+exposure+criticality!==item.result.score)throw new Error("Score mismatch");
 return Object.freeze({motion,exposure,criticality,total:item.result.score});
}
