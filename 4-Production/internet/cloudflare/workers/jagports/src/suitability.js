// #895: evidence-gated normalized variation matching. Never evaluate inferred labels.
export const FIXTURE_NAMESPACE = "fixture:pre-jepc-suitability:v1";
export const FIXTURE_VARIATIONS = Object.freeze([
  { dimension: "body", value: "coupe", label: "Coupe" },
  { dimension: "body", value: "convertible", label: "Convertible" },
  { dimension: "steering", value: "LHD", label: "LHD" },
  { dimension: "steering", value: "RHD", label: "RHD" },
  { dimension: "engine_aspiration", value: "na", label: "NA" },
  { dimension: "engine_aspiration", value: "supercharged", label: "Supercharged" },
  { dimension: "seat_equipment", value: "memory_seat", label: "Memory Seat" },
  { dimension: "seat_equipment", value: "powered_seats", label: "Powered Seats" },
].map((entry) => Object.freeze({ ...entry, key: entry.dimension + ":" + entry.value })));
const approved = new Map(FIXTURE_VARIATIONS.map((item) => [item.key, item]));

function positiveConditions(alternative) {
  const scalar = (alternative.attributes || [])
    .filter((row) => row.operator === "equals")
    .map((row) => row.dimension + ":" + row.value_code);
  const membership = (alternative.memberships || [])
    .filter((row) => row.operator === "contains")
    .map((row) => row.dimension + ":" + row.value_code);
  const prohibited = (alternative.attributes || [])
    .filter((row) => row.operator === "not_equals")
    .concat((alternative.memberships || []).filter((row) => row.operator === "not_contains"))
    .map((row) => row.dimension + ":" + row.value_code);
  return { positive: new Set([...scalar, ...membership]), prohibited: new Set(prohibited) };
}

function eligible(assertion, alternative) {
  // Only explicitly opted-in synthetic test assertions can pass this gate.
  // No live catalogue, guessed qualifier or incomplete scoped context is promoted.
  return assertion.source_namespace === FIXTURE_NAMESPACE
    && assertion.effect === "include"
    && assertion.verification === "verified"
    && assertion.coverage === "complete"
    && assertion.model_context?.verification === "verified"
    && alternative.coverage === "complete"
    && !alternative.serial_range_id && !alternative.effective_serial_range_id
    && (alternative.evidence || []).length > 0;
}

export function evaluateFixtureVariations(assertions, requested = []) {
  if (!Array.isArray(assertions) || !Array.isArray(requested)) {
    throw new TypeError("assertions and requested variations must be arrays");
  }
  const selected = [...new Set(requested)];
  if (selected.some((key) => !approved.has(key))) {
    throw new RangeError("unsupported normalized variation");
  }
  const survivors = [];
  let unresolved = false;
  let hasPositive = false;
  for (const assertion of assertions) {
    if (assertion.source_namespace !== FIXTURE_NAMESPACE) continue;
    if (assertion.effect === "exclude") continue; // Negative evidence never supplies a result.
    if (assertion.verification !== "verified" || assertion.coverage !== "complete") {
      unresolved = true; continue;
    }
    for (const alt of assertion.alternatives || []) {
      if (!eligible(assertion, alt)) { unresolved = true; continue; }
      const conditions = positiveConditions(alt);
      hasPositive = true;
      if (selected.every((key) => conditions.positive.has(key) && !conditions.prohibited.has(key))) {
        survivors.push({
          part_id: assertion.part_id,
          occurrence_id: assertion.part_occurrence_id,
          assertion_id: assertion.id,
          alternative_id: alt.id,
          keys: conditions.positive,
        });
      }
    }
  }
  const keys = new Set(survivors.flatMap((row) => [...row.keys]));
  return {
    state: survivors.length ? "available" : unresolved || !hasPositive ? "unavailable" : "no_match",
    selected,
    part_ids: [...new Set(survivors.map((row) => row.part_id))].sort((a, b) => a - b),
    occurrence_ids: [...new Set(survivors.map((row) => row.occurrence_id))].sort((a, b) => a - b),
    options: FIXTURE_VARIATIONS.filter((item) => keys.has(item.key)),
    unresolved,
  };
}
