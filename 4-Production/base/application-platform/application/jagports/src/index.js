import { normalizePartNumber } from "./part.js";

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

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

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
    const partNumber = text(body.part_number);
    const quantity = Number(body.quantity ?? 0);
    if (!partNumber || !Number.isInteger(quantity) || quantity < 0) {
      return json({ error: "part_number and non-negative integer quantity are required" }, 400);
    }
    const result = await env.DB.prepare(
      "INSERT INTO stock_item (part_number, quantity, condition, status, location, donor_vehicle, source_ref, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      partNumber, quantity, text(body.condition) || "unknown", text(body.status) || "available",
      text(body.location), text(body.donor_vehicle), text(body.source_ref), text(body.notes)
    ).run();
    return json({ id: result.meta.last_row_id }, 201);
  }

  const stockMatch = path.match(/^\/api\/stock\/(\d+)$/);
  if (stockMatch && request.method === "PATCH") {
    const denied = requireAdmin(request, env);
    if (denied) return denied;
    const id = Number(stockMatch[1]);
    const body = await request.json();
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) return json({ error: "quantity must be a non-negative integer" }, 400);
    await env.DB.prepare(
      "UPDATE stock_item SET quantity=?, condition=?, status=?, location=?, donor_vehicle=?, source_ref=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?"
    ).bind(quantity, text(body.condition) || "unknown", text(body.status) || "available", text(body.location), text(body.donor_vehicle), text(body.source_ref), text(body.notes), id).run();
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
