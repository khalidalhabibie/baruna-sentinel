/**
 * Source-backed station-rate contrast from Sitaningrum & Widjajanti (2024).
 * Values are published PPP-derived station velocities for 2021–2023, NOT
 * BARUNA measurements, not the 2010–2021 CSEM OLS series, and not asset rates.
 */
export const PUBLISHED_CORS_CONTRAST=Object.freeze({
  recordType:"PUBLISHED_PPP_STATION_RATES",
  source:"Sitaningrum & Widjajanti (2024), JGISE 7(1), 44–52",
  doi:"10.22146/jgise.95957",
  url:"https://journal.ugm.ac.id/jgise/article/view/95957",
  period:"2021–2023",
  method:"Precise Point Positioning (PPP), station coordinate series",
  sourceScope:"PUBLISHED_STATION_RESULT_NOT_LOCAL_POSITION_SOLUTION",
  stations:Object.freeze([
    Object.freeze({id:"CSMG",name:"Semarang Genuk",verticalMmYr:-94.03,trend:"DOWNWARD"}),
    Object.freeze({id:"CSEM",name:"Semarang",verticalMmYr:+3.23,trend:"UPWARD"})
  ])
});

export function publishedCorsComparison(record=PUBLISHED_CORS_CONTRAST){
  if(record?.recordType!=="PUBLISHED_PPP_STATION_RATES"||
     record.doi!=="10.22146/jgise.95957"||record.period!=="2021–2023"||
     !Array.isArray(record.stations)||record.stations.length!==2)
    throw new TypeError("Unexpected publication provenance");
  const byId=new Map(record.stations.map(s=>[s.id,s]));
  const csmg=byId.get("CSMG"),csem=byId.get("CSEM");
  if(!csmg||!csem||
     csmg.verticalMmYr!==-94.03||csem.verticalMmYr!==3.23)
    throw new TypeError("Unexpected source station values");
  return {
    source:record.source,doi:record.doi,url:record.url,
    period:record.period,method:record.method,
    csmg,csem,
    stationRateContrastMmYr:Math.round(Math.abs(csmg.verticalMmYr-csem.verticalMmYr)*100)/100,
    assetDisplacementInferred:false,
    operationalInspectionPriorityAllowed:false,
    comparableToCsem2010To2021Ols:false,
    comparableToBako2025Qc:false,
    warning:"Same-publication station velocity contrast; not a velocity gradient, an on-asset displacement, or an independent measurement by BARUNA. This is not the separately processed 2010–2021 CSEM descriptive OLS series."
  };
}
