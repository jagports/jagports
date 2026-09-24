import test from "node:test";
import assert from "node:assert/strict";
import { evaluateFixtureVariations as evaluate, FIXTURE_NAMESPACE } from "../src/suitability.js";

const alt = (id, pairs, membership = [], coverage = "complete") => ({
  id, coverage, evidence: [{ id: id + 100 }],
  attributes: pairs.map(([dimension, value_code]) => ({ dimension, value_code, operator: "equals" })),
  memberships: membership.map(([dimension, value_code]) => ({ dimension, value_code, operator: "contains" })),
});
const record = (id, part_id, occurrence, alternatives, overrides = {}) => ({
  id, part_id, part_occurrence_id: occurrence, source_namespace: FIXTURE_NAMESPACE,
  effect: "include", verification: "verified", coverage: "complete",
  model_context: { verification: "verified" }, alternatives, ...overrides,
});
const rows = [
  record(1, 101, 11, [alt(1, [["body", "coupe"], ["steering", "LHD"], ["engine_aspiration", "supercharged"]],
    [["seat_equipment", "memory_seat"], ["seat_equipment", "powered_seats"]])]),
  record(2, 101, 12, [alt(2, [["body", "convertible"], ["steering", "RHD"], ["engine_aspiration", "na"]],
    [["seat_equipment", "powered_seats"]])]),
  record(3, 102, 13, [alt(3, [["body", "coupe"], ["steering", "RHD"], ["engine_aspiration", "na"]])]),
  record(4, 103, 14, [alt(4, [["body", "convertible"], ["steering", "LHD"]])], { effect: "exclude" }),
  record(5, 104, 15, [alt(5, [["body", "coupe"]], [], "incomplete")]),
  record(6, 105, 16, [alt(6, [["body", "coupe"], ["steering", "RHD"], ["engine_aspiration", "supercharged"]])]),
];
test("#895 unchecked options originate only from positive complete fixture occurrences", () => {
  const result = evaluate(rows);
  assert.deepEqual(result.part_ids, [101, 102, 105]);
  assert.ok(result.options.some((x) => x.label === "Memory Seat"));
  assert.ok(!result.part_ids.includes(103));
  assert.equal(result.unresolved, true);
});
test("#895 different dimensions AND within the same occurrence; occurrences OR by canonical PART", () => {
  assert.deepEqual(evaluate(rows, ["body:coupe", "steering:LHD"]).occurrence_ids, [11]);
  assert.deepEqual(evaluate(rows, ["body:convertible", "steering:RHD"]).occurrence_ids, [12]);
  assert.deepEqual(evaluate(rows, ["body:coupe", "engine_aspiration:na"]).part_ids, [102]);
  assert.equal(evaluate(rows, ["body:convertible", "engine_aspiration:supercharged"]).state, "unavailable",
    "an unresolved occurrence prevents a blanket negative without established context coverage");
});
test("#895 seat options use conjunctive set membership, not conflicting scalar equals", () => {
  const match = evaluate(rows, ["seat_equipment:memory_seat", "seat_equipment:powered_seats"]);
  assert.deepEqual(match.occurrence_ids, [11]);
  assert.equal(match.options.some((x) => x.key === "seat_equipment:powered_seats"), true);
});
test("#895 conflicting scalar selections never fabricate a match", () => {
  const result = evaluate(rows.filter((x) => x.id !== 5), ["body:coupe", "body:convertible"]);
  assert.equal(result.state, "no_match");
  assert.deepEqual(result.part_ids, []);
});
test("#895 excludes, unsupported labels and non-fixture namespaces never become options", () => {
  assert.deepEqual(evaluate([rows[3]]).part_ids, []);
  assert.deepEqual(evaluate([record(8, 108, 18, [alt(8, [["body", "coupe"]])], {
    source_namespace: "jepc:unreviewed",
  })]).options, []);
  assert.throws(() => evaluate(rows, ["body:invented"]), RangeError);
});
