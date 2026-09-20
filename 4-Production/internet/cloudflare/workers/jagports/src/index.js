import { normalizePartNumber } from "./part.js";
import { handleViepsPart } from "./vieps.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  return request.headers.get("x-admin-token") === env.ADMIN_TOKEN;
}

function requireAdmin(request, env) {
  if (!isAuthorized(request, env)) return json({ error: "admin authorization required" }, 401);
  return null;
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

const STOCK_CONDITION_CODES = new Set(["A", "B", "C", "D", "E"]);

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function nullableText(value) {
  const normalized = text(value);
  return normalized || null;
}

function nullableId(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : NaN;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : NaN;
}

function normalizedAvailability(value) {
  if (value === true || value === 1 || value === "1") return 1;
  if (value === false || value === 0 || value === "0") return 0;
  return NaN;
}

function normalizeStockRecord(body, existing = null) {
  const base = existing || {
    part_number: "",
    quantity: 0,
    condition: "",
    status: "unavailable",
    location: null,
    donor_vehicle: null,
    source_ref: null,
    notes: null,
    part_id: null,
    donor_vehicle_id: null,
    source: null,
    verification_status: "unverified",
    confidence: null,
    available: 0,
    condition_code: null,
    storage_location_id: null,
    source_party_id: null,
    price: null,
    currency: "EUR",
  };

  const record = {
    part_number: hasOwn(body, "part_number") ? text(body.part_number) : base.part_number,
    quantity: hasOwn(body, "quantity") ? Number(body.quantity) : Number(base.quantity),
    condition: hasOwn(body, "condition") ? text(body.condition) : base.condition,
    location: hasOwn(body, "location") ? nullableText(body.location) : base.location,
    donor_vehicle: hasOwn(body, "donor_vehicle") ? nullableText(body.donor_vehicle) : base.donor_vehicle,
    source_ref: hasOwn(body, "source_ref") ? nullableText(body.source_ref) : base.source_ref,
    notes: hasOwn(body, "notes") ? nullableText(body.notes) : base.notes,
    part_id: hasOwn(body, "part_id") ? nullableId(body.part_id) : base.part_id,
    donor_vehicle_id: hasOwn(body, "donor_vehicle_id") ? nullableId(body.donor_vehicle_id) : base.donor_vehicle_id,
    source: hasOwn(body, "source") ? nullableText(body.source) : base.source,
    verification_status: hasOwn(body, "verification_status") ? text(body.verification_status) : base.verification_status,
    confidence: hasOwn(body, "confidence") ? nullableNumber(body.confidence) : base.confidence,
    available: hasOwn(body, "available") ? normalizedAvailability(body.available) : Number(base.available),
    storage_location_id: hasOwn(body, "storage_location_id") ? nullableId(body.storage_location_id) : base.storage_location_id,
    source_party_id: hasOwn(body, "source_party_id") ? nullableId(body.source_party_id) : base.source_party_id,
    price: hasOwn(body, "price") ? nullableNumber(body.price) : base.price,
    currency: hasOwn(body, "currency") ? text(body.currency).toUpperCase() : base.currency,
  };

  if (hasOwn(body, "condition_code")) {
    const conditionCode = text(body.condition_code).toUpperCase();
    record.condition_code = conditionCode || null;
  } else {
    record.condition_code = base.condition_code;
  }

  record.status = hasOwn(body, "status")
    ? text(body.status)
    : (existing ? base.status : (record.available === 1 ? "available" : "unavailable"));

  if (!record.part_number) return { error: "part_number is required" };
  if (!Number.isInteger(record.quantity) || record.quantity < 0) {
    return { error: "quantity must be a non-negative integer" };
  }
  for (const [name, value] of [
    ["part_id", record.part_id],
    ["donor_vehicle_id", record.donor_vehicle_id],
    ["storage_location_id", record.storage_location_id],
    ["source_party_id", record.source_party_id],
  ]) {
    if (Number.isNaN(value)) return { error: `${name} must be a positive integer or null` };
  }
  if (!Number.isInteger(record.available) || ![0, 1].includes(record.available)) {
    return { error: "available must be 0, 1, true, or false" };
  }
  if (record.condition_code !== null && !STOCK_CONDITION_CODES.has(record.condition_code)) {
    return { error: "condition_code must be A-E or null" };
  }
  if (record.available === 1 && record.storage_location_id === null) {
    return { error: "available stock requires storage_location_id" };
  }
  if (record.part_id === null && record.source_party_id === null && !record.source) {
    return { error: "unresolved stock requires source evidence" };
  }
  if (Number.isNaN(record.price) || (record.price !== null && record.price < 0)) {
    return { error: "price must be a non-negative number or null" };
  }
  if (Number.isNaN(record.confidence)) {
    return { error: "confidence must be a number or null" };
  }
  if (!/^[A-Z]{3}$/.test(record.currency || "")) {
    return { error: "currency must be a three-letter uppercase code" };
  }

  return { record };
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/vieps/part") return handleViepsPart(request, env);

  if (path === "/api/health" && request.method === "GET") {
    try {
      await env.DB.prepare("SELECT 1").first();
      return json({ ok: true, database: "ok" });
    } catch (error) {
      return json({ ok: false, database: "error", message: String(error.message || error) }, 503);
    }
  }

  if (path === "/api/parts" && request.method === "GET") {
    const q = text(url.searchParams.get("q"));
    const normalized = normalizePartNumber(q);
    const stmt = q
      ? env.DB.prepare(
          "SELECT * FROM part WHERE part_number_raw LIKE ? OR part_number_normalized LIKE ? OR description LIKE ? ORDER BY part_number_normalized LIMIT 100"
        ).bind(`%${q}%`, `%${normalized}%`, `%${q}%`)
      : env.DB.prepare("SELECT * FROM part ORDER BY part_number_normalized LIMIT 100");
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/stock" && request.method === "GET") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const q = text(url.searchParams.get("q"));
    const stmt = q
      ? env.DB.prepare("SELECT * FROM stock_item WHERE part_number LIKE ? OR location LIKE ? OR donor_vehicle LIKE ? OR notes LIKE ? ORDER BY part_number, id DESC LIMIT 200").bind(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
      : env.DB.prepare("SELECT * FROM stock_item ORDER BY part_number, id DESC LIMIT 200");
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/stock" && request.method === "POST") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const body = await request.json();
    const normalized = normalizeStockRecord(body);
    if (normalized.error) return json({ error: normalized.error }, 400);
    const stock = normalized.record;
    const result = await env.DB.prepare(
      `INSERT INTO stock_item (
        part_number, quantity, condition, status, location, donor_vehicle, source_ref, notes,
        part_id, donor_vehicle_id, source, verification_status, confidence, available,
        condition_code, storage_location_id, source_party_id, price, currency
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      stock.part_number, stock.quantity, stock.condition, stock.status, stock.location,
      stock.donor_vehicle, stock.source_ref, stock.notes, stock.part_id,
      stock.donor_vehicle_id, stock.source, stock.verification_status, stock.confidence,
      stock.available, stock.condition_code, stock.storage_location_id,
      stock.source_party_id, stock.price, stock.currency
    ).run();
    return json({ id: result.meta.last_row_id }, 201);
  }

  const stockMatch = path.match(/^\/api\/stock\/(\d+)$/);
  if (stockMatch && request.method === "PATCH") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const id = Number(stockMatch[1]);
    const existing = await env.DB.prepare("SELECT * FROM stock_item WHERE id=?").bind(id).first();
    if (!existing) return json({ error: "stock record not found" }, 404);
    const body = await request.json();
    const normalized = normalizeStockRecord(body, existing);
    if (normalized.error) return json({ error: normalized.error }, 400);
    const stock = normalized.record;
    await env.DB.prepare(
      `UPDATE stock_item SET
        part_number=?, quantity=?, condition=?, status=?, location=?, donor_vehicle=?,
        source_ref=?, notes=?, part_id=?, donor_vehicle_id=?, source=?,
        verification_status=?, confidence=?, available=?, condition_code=?,
        storage_location_id=?, source_party_id=?, price=?, currency=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?`
    ).bind(
      stock.part_number, stock.quantity, stock.condition, stock.status, stock.location,
      stock.donor_vehicle, stock.source_ref, stock.notes, stock.part_id,
      stock.donor_vehicle_id, stock.source, stock.verification_status, stock.confidence,
      stock.available, stock.condition_code, stock.storage_location_id,
      stock.source_party_id, stock.price, stock.currency, id
    ).run();
    return json({ ok: true });
  }

  if (stockMatch && request.method === "DELETE") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    await env.DB.prepare("DELETE FROM stock_item WHERE id=?").bind(Number(stockMatch[1])).run();
    return json({ ok: true });
  }

  if (path === "/api/vehicles" && request.method === "GET") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const q = text(url.searchParams.get("q"));
    const stmt = q
      ? env.DB.prepare("SELECT * FROM vehicle WHERE vin_raw LIKE ? OR serial LIKE ? OR model_range LIKE ? ORDER BY id DESC LIMIT 100").bind(`%${q}%`, `%${q}%`, `%${q}%`)
      : env.DB.prepare("SELECT * FROM vehicle ORDER BY id DESC LIMIT 100");
    const { results } = await stmt.all();
    return json({ results });
  }

  if (path === "/api/vehicles" && request.method === "POST") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const body = await request.json();
    const result = await env.DB.prepare(
      "INSERT INTO vehicle (vin_raw, serial, model_range, market, identity_status, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(text(body.vin_raw), text(body.serial), text(body.model_range), text(body.market), text(body.identity_status) || "unresolved", text(body.notes)).run();
    return json({ id: result.meta.last_row_id }, 201);
  }

  return json({ error: "not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await handleApi(request, env); }
      catch (error) { return json({ error: String(error.message || error) }, 500); }
    }
    return env.ASSETS.fetch(request);
  },
};

export { isAuthorized, text, normalizePartNumber };
