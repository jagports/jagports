import test from "node:test";
import assert from "node:assert/strict";

function renderRanges(result) {
  if (result.status === "unavailable") return "Applicability unavailable";
  if (result.status === "no-match") return "No applicable ranges";
  return result.ranges.map((range) => range.name).join(", ");
}

test("PART suitability displays only approved applicable ranges", () => {
  const result = {
    status: "available",
    ranges: [
      { name: "X100" },
      { name: "X150" }
    ],
    excluded: ["F-TYPE"]
  };

  assert.equal(renderRanges(result), "X100, X150");
  assert.ok(!renderRanges(result).includes("F-TYPE"));
});

test("missing applicability is distinguishable from no matching range", () => {
  assert.equal(
    renderRanges({ status: "unavailable" }),
    "Applicability unavailable"
  );
  assert.equal(
    renderRanges({ status: "no-match" }),
    "No applicable ranges"
  );
});
