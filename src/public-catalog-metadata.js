
/**
 * Catalogue-only official metadata; NOT satellite imagery, water-depth,
 * elevation pixels, ground displacement, or geospatial geometry.
 */
export const PUBLIC_CATALOG=Object.freeze({
 demnas:Object.freeze({
  provider:"BIG Geoservices",
  status:"PUBLIC_API_EXPORT_EXISTS_BUT_PIXEL_NO_DATA_NOT_VALIDATED",
  service:"https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer",
  sampleArea:"Around 110.37–110.46 E, 6.90–6.99 S",
  note:"ImageServer export returned URL; getSamples returned ArcGIS NoData sentinel. No verified elevation pixels for use."
 }),
 semarangGis:Object.freeze({
  provider:"Pemkot Semarang",
  status:"PUBLIC_LAYER_METADATA_ONLY",
  url:"https://dataspasial.semarangkota.go.id/maps2",
  layers:Object.freeze(["DRAINASE GENANGAN","DRAINASE ROB","Peta Rawan Rob","Peta Rawan Banjir"]),
  note:"Layer names verified; raw GeoJSON or WFS feature export not yet established."
 }),
 sentinel2:Object.freeze({
  provider:"Copernicus Data Space Ecosystem",
  status:"CATALOGUE_METADATA_ONLY",
  url:"https://catalogue.dataspace.copernicus.eu/odata/v1/Products",
  aoiBbox:Object.freeze([110.35,-6.99,110.48,-6.89]),
  products:Object.freeze([
   Object.freeze({id:"900f9da0-dbf6-40c9-ad6e-611f50365097",date:"2026-10-14",name:"S2A_MSIL2A_20261014T025151_N0513_R132_T49MDN_20261014T073215.SAFE",tileCloudPct:0.04274}),
   Object.freeze({id:"f343debb-743e-4443-98b5-21c28c1a1a31",date:"2026-10-21",name:"S2A_MSIL2A_20261021T024141_N0513_R089_T49MDN_20261021T071604.SAFE",tileCloudPct:1.363901}),
   Object.freeze({id:"ea4b7967-5e52-42f8-97fe-9b26678bf09e",date:"2026-10-22",name:"S2C_MSIL2A_20261022T024741_N0513_R132_T49MDN_20261022T055954.SAFE",tileCloudPct:0.221907})
  ]),
  note:"Cloud cover is whole product/tile, not inspected at project AOI; no image pixels or InSAR measurements loaded."
 })
});
