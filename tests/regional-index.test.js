import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const directory=readFileSync(new URL("../workspaces.html",import.meta.url),"utf8");
const demo=readFileSync(new URL("../spatial-demo.html",import.meta.url),"utf8");
const extractCards=html=>Array.from(html.matchAll(/<article class="rw-card ([^"]+)" data-region-id="([^"]+)" data-region-state="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g),m=>({type:m[1],id:m[2],state:m[3],content:m[4]}));

test("index and directory have one active Semarang and two non-clickable regional placeholders",()=>{
 for(const html of [index,directory]){
  const cards=extractCards(html);
  assert.deepEqual(cards.map(c=>c.id),["semarang","jakarta","surabaya"]);
  assert.deepEqual(cards.map(c=>c.state),["active","placeholder","placeholder"]);
  assert.match(cards[0].content,/href="\.\/real-workspace\.html"/);
  for(const card of cards.slice(1)){
   assert.match(card.type,/rw-card--disabled/);
   assert.doesNotMatch(card.content,/<a\b|<button\b|href=|onclick=|tabindex=/i);
   assert.match(card.content,/Belum tersedia/);
  }
  assert.match(html,/Ranking per area kajian \(AOI\), bukan per kota/);
  assert.match(html,/belum layak diberi ranking operasional/);
  assert.match(html,/simulasi terpisah/);
 }
});

test("Semarang modules remain accessible and mock cities contain no fake data",()=>{
 assert.match(index,/id="pw-page-why"/);
 assert.match(index,/src\/navigation\.js/);
 assert.match(directory,/class="workspace-grid"/);
 assert.equal((directory.match(/class="workspace-card(?: [^"]+)?"/g)||[]).length,4);
 assert.match(demo,/Ranking \& Compare/);
 assert.match(demo,/AOI simulasi Semarang/);
});
