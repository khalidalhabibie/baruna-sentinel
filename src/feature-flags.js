/**
 * Static demo feature flags. Hiding a control is NOT access control.
 * The core published CSEM, verified BAKO, historical-sector evidence and
 * evidence report are always on. Experimental work does not block the demo.
 */
export const FEATURE_FLAGS = Object.freeze({
  inaCorsImport: false,
  syntheticSandbox: false,
  fictionalMapMarkers: false
});

/** Query ?lab=1 is an optional, reversible demo override, not authentication. */
export function resolveFeatureFlags(search = "") {
  const params = new URLSearchParams(search);
  const lab = params.get("lab") === "1";
  return {
    inaCorsImport: FEATURE_FLAGS.inaCorsImport || lab,
    syntheticSandbox: FEATURE_FLAGS.syntheticSandbox || lab,
    fictionalMapMarkers: FEATURE_FLAGS.fictionalMapMarkers || lab
  };
}
