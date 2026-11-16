/**
 * VIDEO-ONLY synthetic ENU coordinates (NOT a BIG coordinate solution).
 * Never ingest this module into Assessment, velocity computations, alerts or reports.
 * Every value is algorithmically invented and has no relationship to true CSEM/CSMG motion.
 */
export const ENU_DEMO_CONTRACT=Object.freeze({
  provenance:"SYNTHETIC_VIDEO_ONLY",
  interval:"MONTHLY_SYNTHETIC",
  start:"2022-01",
  end:"2026-10",
  units:"mm (arbitrary illustrative relative displacement)",
  sourceStatus:"OFFICIAL_NUMERIC_CSV_UNAVAILABLE",
  count:58,
});
export const ENU_DEMO_STATIONS=Object.freeze(["CSEM","CSMG"]);
const rounded=x=>Math.round(x*10)/10;
export function makeSyntheticEnu(station="CSEM"){
  if(!ENU_DEMO_STATIONS.includes(station))throw new RangeError("Unknown demo station");
  const shift=station==="CSEM"?0.4:2.1;
  return Array.from({length:ENU_DEMO_CONTRACT.count},(_,i)=>{
    const year=2022+Math.floor(i/12);
    const month=String(i%12+1).padStart(2,"0");
    const noise=Math.sin(i*2.37+shift)*0.75+Math.cos(i*1.73+shift)*0.45;
    return Object.freeze({
      month:year+"-"+month,
      east:rounded(1.9*Math.sin(i*0.23+shift)+0.055*i+noise),
      north:rounded(2.7*Math.cos(i*0.17+shift)+0.025*i+noise*0.8),
      up:rounded(4.0*Math.sin(i*0.18+shift)-0.17*i+noise*1.4)
    });
  });
}
