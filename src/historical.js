// Published historical field evidence; never treated as current assets' safety statuses.
export function validateHistoricalFieldEvidence(doc) {
  if (doc?.recordType !== "PUBLISHED_HISTORICAL_FIELD_STUDY" || doc?.publication?.doi !== "10.32693/bomg.32.1.2017.351") throw new TypeError("Unexpected research provenance");
  if (doc.reportedSurveyYear !== 2005 || doc.units !== "cumulative_cm" || doc.geometriesAvailable !== false) throw new TypeError("Survey epoch/units/geometries not verified");
  if (!Array.isArray(doc.sectors) || doc.sectors.length !== 6) throw new TypeError("Expected six published sectors");
  const ids = new Set();
  for (const sector of doc.sectors) {
    if (typeof sector.id !== "string" || ids.has(sector.id) || !sector.name || !(Number.isFinite(sector.minCm) && Number.isFinite(sector.maxCm)) || sector.minCm < 0 || sector.maxCm < sector.minCm || sector.locationStatus !== "GEOMETRY_NOT_SUPPLIED") {
      throw new TypeError("Bad historical sector record");
    }
    ids.add(sector.id);
  }
  return doc;
}

const ESC = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export const escapeHistorical = v => String(v).replace(/[&<>"']/g, ch => ESC[ch]);
export const HISTORIC_FILTERS = Object.freeze([
  {id:"all",label:"All six sectors"},
  {id:"coastal",label:"Coastal structures"},
  {id:"port",label:"Port operations"},
  {id:"road",label:"Road access"}
]);
export function filterHistoricalSectors(doc, filter="all") {
  validateHistoricalFieldEvidence(doc);
  if (filter === "all") return doc.sectors;
  if (filter === "coastal") return doc.sectors.filter(s=>s.type === "Coastal defence" || s.type === "Coastal protection");
  if (filter === "port") return doc.sectors.filter(s=>s.type === "Quay / wharf" || s.type === "Port operations");
  if (filter === "road") return doc.sectors.filter(s=>s.type === "Road access");
  throw new RangeError("Unknown filter");
}
export function historicalEvidenceSummary(doc) {
  validateHistoricalFieldEvidence(doc);
  return {
    region: doc.region,
    source: doc.publication,
    reportedSurveyYear: doc.reportedSurveyYear,
    measurementType: doc.method,
    unit: doc.units,
    sectorCount: doc.sectors.length,
    statuses: ["HISTORICAL_REFERENCE_ONLY","UPDATED_MEASUREMENT_REQUIRED","EXACT_SECTOR_GEOMETRY_NOT_SUPPLIED"],
    linkedToCsemMovement: false,
    linkedToBakoQc: false,
    operationalInspectionPriorityAvailable: false,
    sectors: doc.sectors.map(s=>({...s,currentRisk:"UNKNOWN",directGnssMeasurement:false})),
    limitations: doc.limitations
  };
}
export function renderHistoricalSectorCards(doc, filter="all") {
  const records = filterHistoricalSectors(doc,filter);
  return records.map(s=>
    '<button class="historical-sector" type="button" data-sector="'+escapeHistorical(s.id)+'" aria-label="Inspect historical evidence for '+escapeHistorical(s.name)+'">'
    +'<span class="historical-sector-left"><strong>'+escapeHistorical(s.name)+'</strong><small>'+escapeHistorical(s.type)+'</small></span>'
    +'<span class="historical-range">'+s.minCm+'–'+s.maxCm+' cm<small>2005 · cumulative</small></span>'
    +'<span class="historical-next">NEEDS DATA<small>2026 status unknown</small></span>'
    +'</button>').join("");
}
export function renderHistoricalSectorDetail(doc, id) {
  validateHistoricalFieldEvidence(doc);
  const s=doc.sectors.find(s=>s.id===id);
  if(!s) throw new RangeError("Unknown historical sector");
  return '<div class="historical-detail-title"><strong>'+escapeHistorical(s.name)+'</strong><span>RESEARCH REFERENCE · NOT CURRENT MONITORING</span></div>'
    +'<p>Published historical cumulative settlement: <b>'+s.minCm+'–'+s.maxCm+' cm</b> (levelling study reporting measurements in 2005). This figure is <b>not</b> a 2026 displacement rate, GNSS-derived position solution or asset integrity assessment.</p>'
    +'<div class="historical-detail-grid"><div><small>Documented</small><strong>Historical levelling + GPR context</strong></div><div><small>Precise sector geometry</small><strong>Not supplied — do not place an exact pin</strong></div><div><small>Current condition</small><strong>Unknown — needs new inspection evidence</strong></div></div>'
    +'<p class="historical-verification"><b>Next evidence needed:</b> updated site survey / repeat levelling or validated GNSS/InSAR co-registration, authoritative asset boundaries, time-matched observations, engineering inspection criteria.</p>';
}
