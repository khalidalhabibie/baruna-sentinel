/**
 * Source-backed workspaces, not customer deployments or an asset-risk registry.
 * Explicitly separate the 2005 port-sector field study, historic CSEM positions,
 * and independent BAKO observation QC.
 */
export const SOURCE_PROJECTS=Object.freeze([
  Object.freeze({
    id:"semarang-port",
    name:"Tanjung Emas / Semarang",
    area:"Semarang, Central Java",
    kind:"Research case",
    code:"BRN-001",
    period:"2005 field study",
    subject:"Six documented port infrastructure sectors",
    source:"Raharjo & Yosi (2017), DOI: 10.32693/bomg.32.1.2017.351",
    sourceUrl:"https://journal.esdm.go.id/bomg/article/view/12755",
    summary:"Historic cumulative settlement observations provide context for selecting follow-up field verification.",
    limitation:"Exact surveyed sector geometry and contemporary on-asset measurements are unavailable.",
    next:"Confirm asset boundaries and obtain representative modern field measurements.",
    sourceKind:"field",
    evidence:"6 documented sectors",
    support:"Historic sector context",
    geometry:"Not supplied",
    current:"Not available",
    movement:"Not linked to on-asset movement",
    qc:"Separate BAKO reference, not linked",
    output:"Sector verification brief"
  }),
  Object.freeze({
    id:"csem-history",
    name:"CSEM / Semarang",
    area:"Semarang, Central Java",
    kind:"GNSS reference study",
    code:"BRN-002",
    period:"2010–2021",
    subject:"Archived GPS-derived station position series",
    source:"Published historic CSEM GPS-derived station positions",
    sourceUrl:"https://doi.org/10.32693/bomg.32.1.2017.351",
    summary:"3,561 historical station-position epochs available for a descriptive, station-level trend review.",
    limitation:"A GNSS station is not an instrument attached to a particular port structure. The series is not a current asset condition measurement.",
    next:"Verify station metadata, reference frame and local linkage before applying station evidence to assets.",
    sourceKind:"movement",
    evidence:"3,561 archived epochs",
    support:"Historic station trends",
    geometry:"Station reference only",
    current:"Not on an asset",
    movement:"Historical station series",
    qc:"Not validated by independent BAKO QC",
    output:"Technical evidence dossier"
  }),
  Object.freeze({
    id:"bako-observations",
    name:"BAKO / Cibinong",
    area:"Cibinong, West Java",
    kind:"GNSS QC reference",
    code:"BRN-003",
    period:"1 January 2025",
    subject:"Independent archived multi-GNSS observation-quality sample",
    source:"IGS BAKO archived RINEX · GeoRinex verified",
    sourceUrl:"https://network.igs.org/BAKO00IDN",
    summary:"41 observation epochs in a 20-minute window, with pseudorange availability across multiple GNSS constellations.",
    limitation:"Observation availability is not positioning accuracy, displacement, or evidence of movement in Semarang.",
    next:"Use the QC workflow on authorized, site-relevant station-day records before linking any movement interpretation.",
    sourceKind:"qc",
    evidence:"41 observation epochs",
    support:"Observation availability",
    geometry:"Station reference only",
    current:"Not on an asset",
    movement:"No displacement solution",
    qc:"Independent station QC",
    output:"GNSS QC provenance"
  })
]);

export function safeHtml(value){
  return String(value??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
export function safeHttpUrl(value){
  try{
    const u=new URL(String(value));
    return u.protocol==="https:"||u.protocol==="http:"?u.href:null;
  }catch{return null;}
}
export function createDraft({name,area}={}){
  const title=String(name??"").trim(),location=String(area??"").trim();
  if(title.length<3||title.length>72)throw new RangeError("Project title must be 3–72 characters");
  if(location.length<3||location.length>80)throw new RangeError("Area must be 3–80 characters");
  return {
    id:"draft-"+(globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)),
    name:title,area:location,kind:"Local draft",code:"LOCAL",
    period:"Not recorded",subject:"No evidence imported",
    source:"User-created demo record",sourceUrl:null,
    summary:"This draft is a workspace placeholder. No asset observations, GIS data or measurements have been validated.",
    limitation:"No data ingestion or assessment is available for this local-only draft.",
    next:"Collect a source record, authoritative asset geometry and representative observations before any technical assessment.",
    sourceKind:"draft",evidence:"No verified sources",support:"No conclusion",
    geometry:"Not supplied",current:"Not available",
    movement:"Not available",qc:"Not available",output:"Not yet available"
  };
}
export const COMPARE_FIELDS=Object.freeze([
  ["Type","kind"],
  ["Region","area"],
  ["Source period","period"],
  ["Evidence available","evidence"],
  ["Supported interpretation","support"],
  ["Asset geometry","geometry"],
  ["Current on-asset measurements","current"],
  ["Movement evidence","movement"],
  ["Observation QC","qc"],
  ["Available deliverable","output"]
]);
export function comparableProjects(projects,ids){
  const unique=[...new Set(ids)];
  if(unique.length<2||unique.length>3)throw new RangeError("Compare two or three workspaces");
  const chosen=unique.map(id=>projects.find(p=>p.id===id));
  if(chosen.some(p=>!p))throw new RangeError("Unknown workspace");
  return {projects:chosen,rows:COMPARE_FIELDS.map(([label,key])=>({label,values:chosen.map(p=>p[key])}))};
}
