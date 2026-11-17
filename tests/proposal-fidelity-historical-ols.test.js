import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeHistoricalCsemGps,CSEM_HISTORICAL_PROVENANCE} from '../src/csem-historical-audit.js';
const load=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('real CSEM published GPS epochs produce a reproducible descriptive station-only OLS',()=>{
 const r=summarizeHistoricalCsemGps(load('data/CSEM_clean_Noff1site.source-derived.rneu'));
 assert.equal(r.epochCount,3561);
 assert.equal(r.start,'2010-01-13');assert.equal(r.end,'2021-12-31');
 assert.equal(r.station,'CSEM');
 assert.ok(r.spanYears>11.9&&r.spanYears<12);
 assert.ok(r.verticalSlopeMmYr>-0.80&&r.verticalSlopeMmYr<-0.70,'must derive slope from actual source, not fixed value');
 assert.ok(r.maxGapDays>0);
 assert.equal(r.isMultiGnssPositionSolution,false);
 assert.equal(r.isOnAssetMeasurement,false);
 assert.equal(r.canInferRealAssetPriority,false);
 assert.equal(r.comparableToPublishedPpp2021To2023,false);
 assert.equal(r.slopeUncertaintyValidated,false);
 assert.match(r.method,/Descriptive ordinary least-squares/);
 assert.equal(r.doi,CSEM_HISTORICAL_PROVENANCE.doi);
 assert.ok(r.warnings.some(x=>x.includes('not directly comparable')||x.includes('Not directly comparable')));
});
test('missing provenance or truncated source cannot silently create numerical claims',()=>{
 const text=load('data/CSEM_clean_Noff1site.source-derived.rneu');
 assert.throws(()=>summarizeHistoricalCsemGps(text.replace('zenodo.7775016','unverified')),/provenance/);
 assert.throws(()=>summarizeHistoricalCsemGps(text.split('\n').slice(0,200).join('\n')),/Incomplete|changed/);
});
test('proposal original methodology is transparently covered, with clear unimplemented gates',()=>{
 const html=load('proposal-demo.html'),js=load('src/proposal-demo.js'),build=load('scripts/build-static.mjs');
 for(const x of ['id="historical-ols-title"','id="demo-csem-historical"','id="proposal-alignment"','proposal-methodology-table','Streaming Ina-CORS terkini','DEMNAS proposal yang belum diintegrasikan','Geometri aset resmi','DATA INSUFFICIENT','3.561 epoch GPS']){
  assert.ok(html.includes(x),x);
 }
 assert.equal((html.match(/<tr><td><b>0[1-5]\./g)||[]).length,5);
 assert.ok(html.indexOf('id="proposal-alignment"')>html.indexOf('id="step-brief"'));
 assert.match(html,/Copernicus GLO-30 bukan DEMNAS/);
 assert.match(js,/loadHistoricalCsem\(\)/);
 assert.match(js,/historicalCsemGpsOls/);
 assert.match(build,/"src\/csem-historical-audit.js"/);
 assert.match(build,/"data\/CSEM_clean_Noff1site.source-derived.rneu"/);
});
