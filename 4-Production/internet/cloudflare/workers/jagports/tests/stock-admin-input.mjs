import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStockRecord, resolveStockIdentity } from "../src/index.js";

test("normalizeStockRecord accepts normalized MVP fields", () => {
  const normalized = normalizeStockRecord({
    part_number: " C2P0001 ",
    part_id: "12",
    quantity: "2",
    condition_code: "B",
    available: true,
    storage_location_id: "4",
    source_party_id: "5",
    donor_vehicle_id: "",
    price: "125.50",
    currency: "eur",
    source: "manual",
    source_ref: "real-stock",
    notes: "Shelf verified",
  });
  assert.equal(normalized.error, undefined);
  assert.deepEqual({
    part_number: normalized.record.part_number,
    part_id: normalized.record.part_id,
    quantity: normalized.record.quantity,
    condition_code: normalized.record.condition_code,
    available: normalized.record.available,
    storage_location_id: normalized.record.storage_location_id,
    source_party_id: normalized.record.source_party_id,
    donor_vehicle_id: normalized.record.donor_vehicle_id,
    price: normalized.record.price,
    currency: normalized.record.currency,
    source: normalized.record.source,
    source_ref: normalized.record.source_ref,
    notes: normalized.record.notes,
  }, {
    part_number: "C2P0001",
    part_id: 12,
    quantity: 2,
    condition_code: "B",
    available: 1,
    storage_location_id: 4,
    source_party_id: 5,
    donor_vehicle_id: null,
    price: 125.5,
    currency: "EUR",
    source: "manual",
    source_ref: "real-stock",
    notes: "Shelf verified",
  });
});

test("normalizeStockRecord preserves explicit unclassified quality", () => {
  const normalized = normalizeStockRecord({
    part_number: "UNRESOLVED",
    quantity: 1,
    available: false,
    source: "manual",
  });
  assert.equal(normalized.error, undefined);
  assert.equal(normalized.record.condition_code, null);
  assert.equal(normalized.record.available, 0);
});

test("normalizeStockRecord rejects invalid operator input deterministically", () => {
  assert.equal(normalizeStockRecord({ part_number: "", quantity: 1 }).error_code, "quantity_or_part_invalid");
  assert.equal(normalizeStockRecord({ part_number: "X", quantity: 1.5 }).error_code, "quantity_or_part_invalid");
  assert.equal(normalizeStockRecord({ part_number: "X", quantity: 1, condition_code: "Z" }).error_code, "condition_invalid");
  assert.equal(normalizeStockRecord({ part_number: "X", quantity: 1, available: false, source: "manual", price: -1 }).error_code, "price_invalid");
});

test("normalizeStockRecord requires location for available stock", () => {
  const normalized = normalizeStockRecord({
    part_number: "UNRESOLVED",
    quantity: 1,
    available: true,
    source: "manual",
  });
  assert.equal(normalized.error_code, "stock_location_required");
});

test("normalizeStockRecord requires explicit source evidence for unresolved stock", () => {
  const normalized = normalizeStockRecord({
    part_number: "UNRESOLVED",
    quantity: 1,
    available: false,
  });
  assert.equal(normalized.error_code, "unresolved_source_required");
});

test("normalizeStockRecord allows canonical identity to derive its part number later", () => {
  const normalized = normalizeStockRecord({
    part_id: 42,
    quantity: 1,
    available: false,
  });
  assert.equal(normalized.error, undefined);
  assert.equal(normalized.record.part_number, "");
  assert.equal(normalized.record.part_id, 42);
});

test("resolveStockIdentity derives canonical part number from PART", async () => {
  const env = {
    DB: {
      prepare() {
        return {
          bind(id) {
            assert.equal(id, 42);
            return {
              first: async () => ({
                id: 42,
                part_number_raw: " MJB7703AA ",
                part_number_normalized: "MJB7703AA",
              }),
            };
          },
        };
      },
    },
  };
  const normalized = normalizeStockRecord({ part_id: 42, quantity: 1, available: false });
  const resolved = await resolveStockIdentity(env, normalized.record);
  assert.equal(resolved.part_number, "MJB7703AA");
});

test("resolveStockIdentity rejects missing canonical PART", async () => {
  const env = {
    DB: {
      prepare() {
        return {
          bind() {
            return { first: async () => null };
          },
        };
      },
    },
  };
  const normalized = normalizeStockRecord({ part_id: 404, quantity: 1, available: false });
  await assert.rejects(
    () => resolveStockIdentity(env, normalized.record),
    (error) => error.code === "part_not_found"
  );
});
