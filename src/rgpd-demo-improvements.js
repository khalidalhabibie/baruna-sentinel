/**
 * BARUNA RGPD evidence improvement: independent measured RINEX QC, not Semarang deformation.
 * Verification queue is a request for DATA, not a ranked work order or structural safety prediction.
 */
export function validateIndependentBakoQc(raw){
 if(raw?.schema!=="baruna-sentinel-public-igs-qc-summary-v1"||
   raw.status!=="VERIFIED_REAL_RINEX_OBSERVATIONS"||
   raw.source?.station!=="BAKO00IDN"||
   raw.source?.observationDate!=="2025-01-01"||
   !String(raw.source?.stationLocation||"").includes("Cibinong")||
   raw.audit?.epochs!==41||
   raw.audit?.epochsWithNonGpsPseudorange!==41||
   raw.audit?.sampleWindowUtc!=="2025-01-01T00:00–00:20 UTC"||
   raw.audit?.gpsOnlyAveragePseudorangeSatellitesPerEpoch!==8.951||
   raw.audit?.multiGnssAveragePseudorangeSatellitesPerEpoch!==44.634||
   !Array.isArray(raw.audit?.constellationsObservedWithPseudorange)||
   raw.audit.constellationsObservedWithPseudorange.join("|")!=="GPS|GLONASS|Galileo|BeiDou|QZSS|SBAS"||
   raw.audit.notAPositionAccuracyComparison!==true||
   raw.relationshipToSemarang?.linkedToCsemMovement!==false||
   !String(raw.verifiedRun||"").startsWith("https://github.com/khalidalhabibie/baruna-sentinel/actions/runs/"))
  throw new TypeError("BAKO QC independent source, station identity or science disclaimer is invalid.");
 return {
  mode:"INDEPENDENT_OBSERVATION_QC_NOT_SEMARANG_VELOCITY",
  station:"BAKO00IDN",location:"Cibinong, Indonesia",date:"2025-01-01",
  sampleWindowUtc:raw.audit.sampleWindowUtc,epochCount:raw.audit.epochs,
  constellations:[...raw.audit.constellationsObservedWithPseudorange],
  gpsOnlyAverage:raw.audit.gpsOnlyAveragePseudorangeSatellitesPerEpoch,
  multiGnssAverage:raw.audit.multiGnssAveragePseudorangeSatellitesPerEpoch,
  nonGpsEpochs:raw.audit.epochsWithNonGpsPseudorange,
  runUrl:raw.verifiedRun,
  supportsSemarangMotion:false,supportsAssetRisk:false,notPositionAccuracy:true
 };
}

export function verificationActionsForSector(sectorId,{withPublishedCoasterContext=false}={}){
 if(typeof sectorId!=="string"||!sectorId)throw new TypeError("A valid sector ID is required.");
 const coaster=sectorId==="coaster-street";
 const actions=[
  {key:"LOCATE",owner:"Operator aset / tim GIS",priority:"P1",
   title:coaster?"Konfirmasi geometri ruas selatan Jalan Coaster":"Konfirmasi geometri sektor dan titik ukur",
   evidence:coaster?"Identifikasi batas ruas ±725 m dalam studi 2026; cocokkan terhadap sektor pada studi 2005 dan ID aset operator.":"ID aset, geometri resmi, dan lokasi titik survei historis.",
   deliverable:"GeoJSON/registrasi aset dengan datum, sumber, tanggal survei, dan status verifikasi."},
  {key:"MEASURE",owner:"Surveyor geodesi / GNSS",priority:"P1",
   title:"Dapatkan observasi pergerakan pada/representatif aset",
   evidence:"Seri pengukuran berulang GNSS atau levelling pada benchmark terikat aset; tanggal, periode, frame referensi dan uncertainty.",
   deliverable:"Tabel epoch/NEU dan estimasi tren berserta ketidakpastian, bila rentang observasi memadai."},
  {key:"EXPOSURE",owner:"GIS / pesisir / teknik sipil",priority:"P2",
   title:coaster?"Verifikasi elevasi dan datum muka air Jalan Coaster":"Verifikasi paparan pesisir dengan datum yang seragam",
   evidence:coaster?"Periksa referensi mLWS pada studi 2026 dan kecocokan dengan data terkini; jangan kurangi elevasi DSM untuk menghitung kedalaman rob.":"DEM/elevasi, jarak ke pantai dan sumber muka air yang sesuai datum.",
   deliverable:"Indikator paparan berprovenance, bukan perkiraan kedalaman atau prediksi rob."},
  {key:"CRITICALITY",owner:"Pemilik aset + reviewer geodesi",priority:"P2",
   title:"Setujui kekritisan dan kebijakan prioritas",
   evidence:"Dampak gangguan operasional, tingkat layanan, bobot/ambang yang disetujui, dan pemeriksaan keterwakilan pengukuran.",
   deliverable:"Policy version + tanda kaji metode; baru kemudian pertimbangkan ranking per AOI."}
 ];
 return {sectorId,mode:"EVIDENCE_VERIFICATION_BACKLOG_NOT_INSPECTION_RANK",
   operationalRanking:"DATA_INSUFFICIENT",rankingAllowed:false,
   caseContext:coaster&&withPublishedCoasterContext?"PUBLISHED_2026_COASTER_EXPOSURE_UNVERIFIED_SEGMENT_LINK":"HISTORICAL_REFERENCE_ONLY",
   actions};
}
