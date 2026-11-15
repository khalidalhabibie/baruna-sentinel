import test from "node:test";
import assert from "node:assert/strict";
import {SOURCE_PROJECTS,safeHtml,safeHttpUrl,createDraft,comparableProjects} from "./projects.js";

test("the workspace registry distinguishes historic port sectors from independent GNSS studies",()=>{
  assert.equal(SOURCE_PROJECTS.length,3);
  assert.deepEqual(SOURCE_PROJECTS.map(p=>p.id),["semarang-port","csem-history","bako-observations"]);
  assert.equal(SOURCE_PROJECTS[0].geometry,"Not supplied");
  assert.equal(SOURCE_PROJECTS[0].current,"Not available");
  assert.equal(SOURCE_PROJECTS[1].sourceUrl,"https://doi.org/10.5281/zenodo.7775016");
  assert.equal(SOURCE_PROJECTS[2].movement,"No displacement solution");
  assert.ok(SOURCE_PROJECTS.every(p=>!p.kind.includes("Customer")));
});
test("evidence comparisons show source coverage, not risk ratings",()=>{
  const result=comparableProjects(SOURCE_PROJECTS,["semarang-port","csem-history"]);
  assert.equal(result.rows.length,10);
  assert.deepEqual(result.rows.find(r=>r.label==="Current on-asset measurements").values,["Not available","Not on an asset"]);
  assert.throws(()=>comparableProjects(SOURCE_PROJECTS,["semarang-port"]),RangeError);
  assert.throws(()=>comparableProjects(SOURCE_PROJECTS,["semarang-port","unknown"]),RangeError);
});
test("drafts are explicitly non-validated and strict-input",()=>{
  const draft=createDraft({name:"North coast survey",area:"Semarang, Indonesia"});
  assert.match(draft.id,/^draft-/);
  assert.equal(draft.current,"Not available");
  assert.equal(draft.support,"No conclusion");
  assert.equal(draft.sourceKind,"draft");
  assert.throws(()=>createDraft({name:"",area:"Semarang"}),RangeError);
  assert.throws(()=>createDraft({name:"Test",area:""}),RangeError);
});
test("user-visible content is escaped, source links require http(s)",()=>{
  assert.equal(safeHtml('<script>"x"</script>'),'&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  assert.equal(safeHttpUrl("javascript:alert(1)"),null);
  assert.equal(safeHttpUrl("https://example.org/data"),"https://example.org/data");
});
