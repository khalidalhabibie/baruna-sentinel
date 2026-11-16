/**
 * BARUNA real DSM AOI screening. Uses the published 72x98 downsampled
 * Copernicus DEM GLO-30 DSM display grid. No flood or asset-risk model.
 * Coordinates EPSG:4326 (lon/lat), measurements in source DSM vertical
 * reference (NOT validated against BMKG MSL).
 */
export function normalizeArea(a, sourceBounds) {
  if (!Array.isArray(a) || !Array.isArray(sourceBounds) || a.length !== 4 || sourceBounds.length !== 4 ||
    [...a,...sourceBounds].some(v => !Number.isFinite(v))) throw new TypeError("AOI bbox invalid");
  const [w,s,e,n] = sourceBounds;
  const area = [Math.min(a[0],a[2]),Math.min(a[1],a[3]),Math.max(a[0],a[2]),Math.max(a[1],a[3])];
  const clipped = [Math.max(w,area[0]),Math.max(s,area[1]),Math.min(e,area[2]),Math.min(n,area[3])];
  if (clipped[0] >= clipped[2] || clipped[1] >= clipped[3]) return null;
  return clipped;
}
export function bboxAreaKm2([w,s,e,n]) {
  const radians=Math.PI/180;
  const earthRadiusKm=6371.0088;
  return earthRadiusKm**2*Math.abs((e-w)*radians)*Math.abs(Math.sin(n*radians)-Math.sin(s*radians));
}
/**
 * Grid is row-major NORTH -> SOUTH, WEST -> EAST.
 * Include pixels by their center coordinates, exclude NoData and non-finite
 * values. This is a pixel-center screen for a DISPLAY preview, not zonal
 * statistics from the native 30m source raster.
 */
export function analyzeDsmArea(grid,meta,requestBbox) {
  const bounds=normalizeArea(requestBbox,meta.aoiEpsg4326);
  if (!bounds) return {status:"OUTSIDE_SOURCE_AOI",bounds:null,validPixels:0};
  const [width,height]=meta.previewSize;
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<=0||height<=0||
      grid.length!==width*height) throw new TypeError("DSM preview dimensions mismatch");
  const [w,s,e,n]=meta.aoiEpsg4326;
  const samples=[];
  let selectedPixels=0;
  for(let row=0;row<height;row++) {
    const lat=n-(row+.5)/height*(n-s);
    if(lat<bounds[1]||lat>bounds[3]) continue;
    for(let col=0;col<width;col++) {
      const lon=w+(col+.5)/width*(e-w);
      if(lon<bounds[0]||lon>bounds[2]) continue;
      selectedPixels++;
      const code=grid[row*width+col];
      if (code===meta.nodataCode || !Number.isFinite(code)) continue;
      const meters=meta.offsetMeters+meta.stepMeters*code;
      if(Number.isFinite(meters))samples.push(meters);
    }
  }
  if(selectedPixels===0) return {status:"TOO_SMALL_FOR_PREVIEW_GRID",
    bounds,selectedPixels,validPixels:0,areaKm2:Number(bboxAreaKm2(bounds).toFixed(3))};
  if(samples.length===0) return {status:"NO_VALID_DSM_PIXELS",
    bounds,selectedPixels,validPixels:0,areaKm2:Number(bboxAreaKm2(bounds).toFixed(3))};
  samples.sort((a,b)=>a-b);
  const quantile=p=>{
    const pos=(samples.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);
    return samples[lo]+(samples[hi]-samples[lo])*(pos-lo);
  };
  const round=n=>Number(n.toFixed(2));
  const sum=samples.reduce((a,b)=>a+b,0);
  return {
    status:"VALID_DISPLAY_GRID_STATS",bounds,
    areaKm2:round(bboxAreaKm2(bounds)),
    selectedPixels,validPixels:samples.length,
    coveragePct:round(100*samples.length/selectedPixels),
    minM:round(samples[0]),maxM:round(samples.at(-1)),
    meanM:round(sum/samples.length),medianM:round(quantile(.5)),
    p25M:round(quantile(.25)),p75M:round(quantile(.75)),
    resolution:"72x98 quantized display preview; not native Copernicus DEM resolution",
    includesSeaAndStructures:true,
    warning:"Whole DSM pixels may include sea/buildings. No water/land mask. No flood depth, asset safety or subsidence inference."
  };
}
