/**
 * BARUNA SENTINEL: VIDEO-ONLY SYNTHETIC CONTEXT FIXTURES.
 * This file has NO actual field measurement, raster pixel, tide observation,
 * Sentinel scene, geodetic coordinate series or official asset geometry.
 * Replace each future provider at the adapter boundary after provenance,
 * license, datum, uncertainty and coverage are validated.
 *
 * DO NOT IMPORT this module into the source-backed Assessment workflow.
 */
export const VIDEO_FIXTURE_VERSION="baruna-video-only-v1";
export const SOURCE_STATUS=Object.freeze({
  SYNTHETIC:"SYNTHETIC_PREVIEW",
  PENDING:"PENDING_REAL_DATA",
  LOCAL:"LOCAL_USER_IMPORT",
  FORECAST:"SOURCE_BACKED_FORECAST",
  CATALOGUE:"VERIFIED_CATALOGUE_ONLY"
});
export const VIDEO_SOURCES=Object.freeze([
  Object.freeze({
    id:"cors",title:"Ina-CORS CSEM / CSMG",provider:"BIG SRGI",
    status:SOURCE_STATUS.LOCAL,source:"https://srgi.big.go.id/page/unduh-data-rinex",
    next:"Impor JSON QC lokal dari arsip observasi RINEX 2026",role:"Cakupan observasi stasiun"
  }),
  Object.freeze({
    id:"station_series",title:"Time Series koordinat harian",provider:"BIG SRGI",
    status:SOURCE_STATUS.PENDING,source:"https://srgi.big.go.id/cors/CSMG",
    next:"Minta XYZ/ENU numerik, epoch, reference frame, ketidakpastian",role:"Solusi posisi stasiun, bukan aset"
  }),
  Object.freeze({
    id:"demnas",title:"DEMNAS",provider:"BIG Geoservices",
    status:SOURCE_STATUS.SYNTHETIC,
    source:"https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer",
    next:"Query raster AOI, validasi CRS/datum vertikal & resolusi",role:"Konteks elevasi"
  }),
  Object.freeze({
    id:"tide",title:"Pasut / muka air",provider:"BMKG Maritim",
    status:SOURCE_STATUS.FORECAST,
    source:"https://maritim.bmkg.go.id/cuaca/pasut",
    next:"Prakiraan 16–22 Nov 2026 dari CSV ekspor pengguna; bukan observasi/risiko rob",role:"Konteks lingkungan pesisir"
  }),
  Object.freeze({
    id:"drainage",title:"Rob & drainase",provider:"Pemkot Semarang",
    status:SOURCE_STATUS.CATALOGUE,
    source:"https://dataspasial.semarangkota.go.id/maps2",
    next:"Konfirmasi layer, format, lisensi dan tanggal pemutakhiran",role:"Lapisan konteks, bukan inspeksi aset"
  }),
  Object.freeze({
    id:"satellite",title:"Citra Sentinel-1 / Sentinel-2",provider:"Copernicus",
    status:SOURCE_STATUS.CATALOGUE,
    source:"https://dataspace.copernicus.eu/browser/",
    next:"Ambil scene dan jejak pemrosesan: Sentinel-1 SLC untuk InSAR; L2A untuk citra optik",role:"Konteks perubahan permukaan"
  }),
  Object.freeze({
    id:"assets",title:"Geometri & survei aset",provider:"Operator (belum tersedia)",
    status:SOURCE_STATUS.SYNTHETIC,
    source:null,
    next:"Impor geometri resmi, data inspeksi terbaru, klasifikasi dan izin pemanfaatan",role:"Penghubung bukti ke tindakan"
  })
]);

// All DEMO-ID assets are fictional and are displayed only on a schematic,
// never as georeferenced positions on a real basemap.
export const VIDEO_ASSETS=Object.freeze([
  Object.freeze({id:"DEMO-A",name:"Sektor A · Contoh tepi tambatan",type:"FIKTIF",
    context:"Konteks genangan dan elevasi (simulasi)",
    expectedAction:"Minta survei levelling dan konfirmasi titik kontrol",
    position:Object.freeze({x:120,y:152})}),
  Object.freeze({id:"DEMO-B",name:"Sektor B · Contoh akses logistik",type:"FIKTIF",
    context:"Konteks drainase dan pasut (simulasi)",
    expectedAction:"Minta validasi drainase dan riwayat inspeksi aset",
    position:Object.freeze({x:288,y:198})}),
  Object.freeze({id:"DEMO-C",name:"Sektor C · Contoh area penyimpanan",type:"FIKTIF",
    context:"Konteks perubahan tutupan permukaan (simulasi)",
    expectedAction:"Minta polygon aset dan observasi lapangan terbaru",
    position:Object.freeze({x:450,y:140})})
]);

export const VIDEO_CONTEXT=Object.freeze({
  provenance:"SYNTHETIC_PREVIEW",
  disclaimer:"Profil elevasi dan sektor aset adalah simulasi. Prakiraan BMKG ditampilkan sebagai data sumber hanya bila CSV lolos validasi; metadata Sentinel-2 bukan citra teranalisis. Tidak ada klaim rob atau risiko aset.",
  elevation:Object.freeze({unit:"m (contoh)",profile:Object.freeze([1.2,1.7,2.1,1.8,2.6,3.2,2.8,3.6,4.1])}),
  tide:Object.freeze({unit:"m (contoh)",hours:Object.freeze(["00","03","06","09","12","15","18","21"]),values:Object.freeze([0.12,0.41,0.68,0.27,-0.16,-0.36,0.07,0.39])}),
  landCover:Object.freeze({label:"Ilustrasi lapisan citra",status:"Belum dihitung dari Sentinel-1/2"}),
  positionSolution:Object.freeze({status:"NO_NUMERIC_SERIES",velocityMmPerYear:null,uncertaintyMm:null}),
  verifiedAssetGeometry:false
});
export function validateVideoSources(sources=VIDEO_SOURCES){
 if(!Array.isArray(sources)||sources.length!==7)throw new TypeError("Video fixture source contract mismatch");
 if(sources.some(x=>!Object.values(SOURCE_STATUS).includes(x.status)||!x.next||!x.role))throw new TypeError("Every source requires an explicit provenance/status");
 if(VIDEO_CONTEXT.positionSolution.velocityMmPerYear!==null||
    VIDEO_CONTEXT.verifiedAssetGeometry!==false)
   throw new TypeError("Synthetic context must never provide a real position or asset");
 return sources;
}