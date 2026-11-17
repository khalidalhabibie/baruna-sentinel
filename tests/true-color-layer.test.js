import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateTrueColorMetadata,trueColorLeafletBounds,installTrueColorLayer} from '../src/true-color-layer.js';
const data=JSON.parse(readFileSync(new URL('../data/semarang-true-color-preview.json',import.meta.url)));

// These tests use the real user-uploaded, SHA-validated imagery derivative; no mock pixels.
test('actual RGB provenance, WGS84 geometry, and source date validate',()=>{
 assert.equal(validateTrueColorMetadata(data),true);
 const [[south,west],[north,east]]=trueColorLeafletBounds(data);
 assert.ok(west>110.37 && east<110.49 && south< -6.99 && north > -6.9);
 assert.equal(data.rgbBands.join(','),'B04,B03,B02');
 assert.equal(data.acquiredUtc.slice(0,10),'2026-10-14');
 assert.equal(data.webPreview.displayOnly,true);
});
test('encoded web RGB JPEG cryptographic checksum matches uploaded derivative',()=>{
 const bytes=Buffer.from(data.webPreview.base64,'base64');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),data.webPreview.imageSha256);
 assert.equal(bytes[0],0xff); assert.equal(bytes[1],0xd8);
});
test('modified scene, geometry, or source hash cannot masquerade as validated',()=>{
 for(const bad of [{sceneId:'UNKNOWN'},{sourceRgbGeoTiffSha256:'f'.repeat(64)},{wgs84Bounds:[105,-7,110,-6]}]){
  assert.throws(()=>validateTrueColorMetadata({...data,...bad}),/invalid/);
 }
});

test('real imagery toggles on, opacity updates, OSM fallback remains available',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 const elements=new Map();
 for(const id of ['basemap-street','basemap-satellite','satellite-opacity','satellite-opacity-value','satellite-opacity-control','satellite-source-note']){
  elements.set(id,{id,value:id==='satellite-opacity'?'90':'',hidden:id==='satellite-opacity-control',disabled:false,dataset:{},
    textContent:'',handlers:{},setAttribute(name,value){this[name]=value;},addEventListener(event,fn){this.handlers[event]=fn;}});
 }
 const added=new Set();
 const pane={style:{}};
 const map={createPane(){},getPane(){return pane;},hasLayer(layer){return added.has(layer);},removeLayer(layer){added.delete(layer);}};
 const overlays=[];
 const L={imageOverlay(url,bounds,options){const layer={url,bounds,options,events:{},
     on(event,fn){this.events[event]=fn;return this;},addTo(map){added.add(this);return this;},setOpacity(v){this.opacity=v;}};
     overlays.push(layer);return layer;}};
 globalThis.window={L,addEventListener(){}};
 globalThis.document={getElementById(id){return elements.get(id);},body:{dataset:{}}};
 globalThis.fetch=async()=>({ok:true,json:async()=>data});
 try{
  await installTrueColorLayer(map);
  assert.equal(overlays.length,1);
  const layer=overlays[0];
  assert.equal(layer.options.pane,'barunaTrueColorPane');
  assert.equal(pane.style.zIndex,'230');
  assert.equal(added.has(layer),true);
  assert.equal(elements.get('basemap-satellite')['aria-pressed'],'true');
  elements.get('basemap-street').handlers.click();
  assert.equal(added.has(layer),false);
  elements.get('basemap-satellite').handlers.click();
  assert.equal(added.has(layer),true);
  elements.get('satellite-opacity').value='65';
  elements.get('satellite-opacity').handlers.input();
  assert.equal(layer.opacity,.65);
  assert.match(elements.get('satellite-source-note').textContent,/bukan InSAR/);
 } finally{
  for(const [name,prev] of Object.entries(previous)){
   if(prev===undefined)delete globalThis[name]; else globalThis[name]=prev;
  }
 }
});