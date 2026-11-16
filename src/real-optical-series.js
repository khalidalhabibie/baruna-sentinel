/**
 * Source-derived multi-date Sentinel-2 L2A index previews, never pixel-label
 * inference of verified flooding, actual land-cover change or asset safety.
 * Original native GeoTIFFs remain in private operator workspace.
 */
export const OPTICAL_VIEWS = Object.freeze([
  {key:'baselineNdwi',name:'NDWI · 14 Okt 2026',short:'NDWI',date:'14 Okt 2026',kind:'index'},
  {key:'baselineMndwi',name:'MNDWI · 14 Okt 2026',short:'MNDWI',date:'14 Okt 2026',kind:'index'},
  {key:'comparisonNdwi',name:'NDWI · 21 Okt 2026',short:'NDWI',date:'21 Okt 2026',kind:'index'},
  {key:'comparisonMndwi',name:'MNDWI · 21 Okt 2026',short:'MNDWI',date:'21 Okt 2026',kind:'index'},
  {key:'mndwiContrast',name:'Δ MNDWI · 21 − 14 Okt',short:'Δ MNDWI',date:'21 − 14 Okt',kind:'difference'}
]);
const AOI = [110.375,-7.025,110.485,-6.875];
const BASE_SCENE='S2B_T49MDN_20261014T025716_L2A';
const COMPARISON_SCENE='S2A_T49MDN_20261021T025248_L2A';
const BASE_SHA='d398e1af132b23fb3daecaf6477ed8f142d25dd02b6b3218a5c572c15d294363';
const B11_SHA='0f590174926613e63534d1a7cfc8a6dfb1a6b72c8d19d8b2f745d76f2b0ff3a5';
const COMP_SHA='4e1534eed55ca7094477dff93a9b1874123b07edac85962c7def870f3a6cf17f';

export function validateOpticalSeries(m) {
  if (m?.schema!=='baruna-optical-index-series-v1' ||
      m.sourceKind!=='VERIFIED_SOURCE_DERIVED_MULTI_DATE_OPTICAL_DISPLAY' ||
      m.upstreamSchema!=='baruna-optical-extension-v1' ||
      m.baseline?.sceneId!==BASE_SCENE || m.comparison?.sceneId!==COMPARISON_SCENE ||
      m.baseline?.acquiredUtc?.slice(0,10)!=='2026-10-14' ||
      m.comparison?.acquiredUtc?.slice(0,10)!=='2026-10-21' ||
      m.baseline?.originalFourBandSha256!==BASE_SHA || m.baseline?.b11Sha256!==B11_SHA ||
      m.comparison?.rasterSha256!==COMP_SHA ||
      m.sourceCrs!=='EPSG:32749' || m.aoiEpsg4326?.join(',')!==AOI.join(',') ||
      m.nativePixelSize?.join(',')!=='1218,1660' || m.nativePixelSizeMeters!==10 ||
      m.indices?.calibration?.scale!==0.0001 || m.indices?.calibration?.offset!==-0.1 ||
      m.indices?.notFloodExtent!==true || m.indices?.notRobDetection!==true ||
      m.indices?.displayOnly!==true || !(m.indices?.bothDatesValidFraction>0.8) ||
      !/^[a-f0-9]{64}$/.test(m.upstreamManifestSha256||''))
    throw Error('Sentinel-2 multi-date provenance invalid');
  for(const view of OPTICAL_VIEWS) {
    const p=m.previews?.[view.key];
    if(p?.encoded!=='zlib-deflate-base64-u8' ||
       p.previewSize?.join(',')!=='72,98' || p.nodataCode!==255 || p.step!==0.02 ||
       p.minimum!==(view.kind==='difference'?-2:-1) ||
       !/^[a-f0-9]{64}$/.test(p.gridSha256||'') ||
       typeof p.b64!=='string' || p.b64.length<100 ||
       !(p.validFraction>0.8 && p.validFraction<=1))
      throw Error('Invalid optical preview '+view.key);
  }
  return true;
}

export async function decodeOpticalSeries(m) {
  validateOpticalSeries(m);
  if (typeof DecompressionStream!=='function' || !globalThis.crypto?.subtle)
    throw Error('Browser lacks the required integrity/decompression APIs');
  const grids={};
  for(const view of OPTICAL_VIEWS){
    const p=m.previews[view.key];
    const deflated=Uint8Array.from(atob(p.b64),c=>c.charCodeAt(0));
    const stream=new Blob([deflated]).stream().pipeThrough(new DecompressionStream('deflate'));
    const grid=new Uint8Array(await new Response(stream).arrayBuffer());
    if(grid.length!==p.previewSize[0]*p.previewSize[1] || grid.some(v=>v!==255 && v>200))
      throw Error('Invalid pixel length/code: '+view.key);
    const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',grid));
    const hash=Array.from(digest,v=>v.toString(16).padStart(2,'0')).join('');
    if(hash!==p.gridSha256)throw Error('Optical grid SHA256 mismatch: '+view.key);
    grids[view.key]=grid;
  }
  return grids;
}

export function sampleOpticalValue(grid,p,lat,lon){
  if(!grid || !p || !Number.isFinite(lat)||!Number.isFinite(lon))return null;
  const [w,s,e,n]=AOI;
  if(lat<s||lat>n||lon<w||lon>e)return null;
  const [width,height]=p.previewSize;
  const col=Math.min(width-1,Math.floor((lon-w)/(e-w)*width));
  const row=Math.min(height-1,Math.floor((n-lat)/(n-s)*height));
  const code=grid[row*width+col];
  return code===255||code===undefined?null:Number((p.minimum+code*p.step).toFixed(2));
}

/** Statistics refer ONLY to sampled 72x98 grid cells; not 10m raster area. */
export function opticalAreaStats(grid,p,bounds){
  if(!grid||!p||!Array.isArray(bounds)||bounds.length!==4) return null;
  const [west,south,east,north]=bounds;
  if(![west,south,east,north].every(Number.isFinite)||west>=east||south>=north)return null;
  const [aw,as,ae,an]=AOI;
  const [width,height]=p.previewSize;
  if(grid.length!==width*height)throw Error('Optical grid size mismatch');
  const values=[];
  let selected=0;
  for(let row=0;row<height;row++){
    const lat=an-(row+0.5)*(an-as)/height;
    if(lat<south||lat>north)continue;
    for(let col=0;col<width;col++){
      const lon=aw+(col+0.5)*(ae-aw)/width;
      if(lon<west||lon>east)continue;
      selected++;
      const code=grid[row*width+col];
      if(code!==255)values.push(p.minimum+code*p.step);
    }
  }
  if(selected===0)return {status:'NO_DISPLAY_GRID_CELLS',selectedPixels:0,validPixels:0};
  if(values.length===0)return {status:'NO_VALID_DISPLAY_PIXELS',selectedPixels:selected,validPixels:0};
  values.sort((a,b)=>a-b);
  const quantile=f=>{
    const i=(values.length-1)*f, low=Math.floor(i),hi=Math.ceil(i);
    return values[low]*(1-(i-low))+values[hi]*(i-low);
  };
  return {
    status:'DISPLAY_GRID_INDEX_STATS_NOT_FLOOD',
    selectedPixels:selected,validPixels:values.length,
    validPct:Number((values.length/selected*100).toFixed(2)),
    median:Number(quantile(.5).toFixed(3)),
    p10:Number(quantile(.1).toFixed(3)),
    p90:Number(quantile(.9).toFixed(3)),
    min:Number(values[0].toFixed(3)),max:Number(values.at(-1).toFixed(3)),
    previewSize:[width,height],
    interpretation:'Quantized optical index only: NOT observed flood/rob area, water depth, or risk.'
  };
}

const indexColors=[[-1,[142,91,60]],[-.4,[207,159,104]],[0,[245,235,202]],[.4,[92,181,168]],[1,[18,96,160]]];
const differenceColors=[[-.3,[165,81,66]],[-.12,[227,164,123]],[0,[241,238,220]],[.12,[111,181,195]],[.3,[25,103,158]]];
function ramp(value,stops){
  if(value<=stops[0][0])return stops[0][1];
  for(let i=1;i<stops.length;i++)if(value<=stops[i][0]){
    const [left,a]=stops[i-1], [right,b]=stops[i];
    const t=(value-left)/(right-left);
    return a.map((x,j)=>Math.round(x+(b[j]-x)*t));
  }
  return stops.at(-1)[1];
}
export function opticalGridOverlayUrl(grid,p,viewKey){
  const [w,h]=p.previewSize;
  if(!grid||grid.length!==w*h)throw Error('Invalid optical map grid');
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
  const img=ctx.createImageData(w,h);
  const stops=viewKey==='mndwiContrast'?differenceColors:indexColors;
  for(let i=0;i<grid.length;i++){
    if(grid[i]===255)continue;
    const rgb=ramp(p.minimum+grid[i]*p.step,stops);
    img.data.set(rgb,i*4);img.data[4*i+3]=231;
  }
  ctx.putImageData(img,0,0);
  return canvas.toDataURL('image/png');
}

export function opticalSeriesExport(m,selectedView,areaStats){
  if(!m)return null;
  const view=OPTICAL_VIEWS.find(v=>v.key===selectedView)||OPTICAL_VIEWS[0];
  return {
    sourceKind:m.sourceKind,
    sceneIds:{baseline:m.baseline.sceneId,comparison:m.comparison.sceneId},
    acquiredUtc:{baseline:m.baseline.acquiredUtc,comparison:m.comparison.acquiredUtc},
    sourceRasterSha256:{baselineB03B04B08Scl:m.baseline.originalFourBandSha256,
       baselineB11:m.baseline.b11Sha256,comparisonB03B08B11Scl:m.comparison.rasterSha256},
    upstreamManifestSha256:m.upstreamManifestSha256,
    sourceCrs:m.sourceCrs,sourcePixelResolutionMeters:m.nativePixelSizeMeters,
    view:view.name,viewKey:view.key,
    displayGridSize:m.previews[view.key].previewSize,
    gridSha256:m.previews[view.key].gridSha256,
    correction:m.indices.calibration,mask:m.indices.mask,
    bothDatesValidFraction:m.indices.bothDatesValidFraction,
    areaPreviewStatistics:areaStats,
    status:'VALID_SOURCE_DERIVED_EXPLORATORY_OPTICAL_INDEX_CONTRAST',
    validatedFloodOrRobExtent:false,validatedLandCoverChange:false,
    usableForAssetRisk:false,notAnInSARProduct:true,
    limitations:m.limitations
  };
}