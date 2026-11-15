import test from "node:test";
import assert from "node:assert/strict";
import {FEATURE_FLAGS,resolveFeatureFlags} from "./feature-flags.js";

test("competition mode hides all experimental GNSS and fictional map controls", () => {
  assert.deepEqual(resolveFeatureFlags(),{
    inaCorsImport:false,syntheticSandbox:false,fictionalMapMarkers:false
  });
  assert.equal(FEATURE_FLAGS.inaCorsImport,false);
});
test("lab URL is explicit opt-in and can be disabled with no state retained", () => {
  const lab=resolveFeatureFlags("?lab=1");
  assert.ok(Object.values(lab).every(Boolean));
  assert.equal(resolveFeatureFlags("?lab=0").inaCorsImport,false);
  assert.equal(resolveFeatureFlags("?lab=off").syntheticSandbox,false);
});
