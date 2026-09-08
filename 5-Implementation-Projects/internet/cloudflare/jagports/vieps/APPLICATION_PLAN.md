# Jagports Application MVP — Proposal and Implementation Plan

Issue: #280

## 1. MVP decision

The MVP should be a real full-stack web application, not a GitHub Pages-only application.

### GitHub Pages

GitHub Pages is suitable for a static documentation or frontend-only site, but it does not provide the persistent server-side application/database needed for stock inventory. A GitHub Pages frontend could call an external API, but that would still require a separate backend and database.

### Recommended $0 runtime

Use **Cloudflare Workers Static Assets + Workers + D1** as the initial hosted application.

```text
Browser
  |
  v
Cloudflare Access
  |
  v
Cloudflare Worker
  |---- static web UI
  |
  +---- /api/*
           |
           v
        D1 SQLite
          |---- part reference data
          |---- stock inventory
          |---- vehicle/identity data when added
```

The application source is production code and belongs under the approved repository structure:

```text
4-Production/application/jagports-mvp/
```

## 2. MVP boundary

The MVP deliberately does **not** attempt to implement the whole future Jaguar knowledge engine.

### Included

1. Vehicle/VIN input and a vehicle-context record.
2. Part-number search.
3. Part detail/reference data.
4. Basic fitment result structure ready for JEPC VIN/attribute rules.
5. Stock inventory CRUD.
6. Inventory search/filter.
7. Source/donor reference and notes.
8. Manual verification/status fields.
9. Persistent D1 storage.
10. Responsive browser UI.
11. Automated smoke/schema tests.
12. Cloudflare deployment configuration.
13. Cloudflare Access as the required outer authentication boundary before real inventory use.

### Deferred

- Complete Jaguar VIN decoding for all generations.
- Full JEPC attribute reverse engineering.
- Full JEPC diagram/hotspot rendering.
- Complete SNG/JLR catalogue import.
- Multi-user role/permission system.
- Customer-facing commercial functions.
- Automated agent orchestration.

Those remain separate issues and must not silently expand this MVP.

## 3. Data separation

The application must keep three concepts separate:

### Reference data

Jaguar/JEPC catalogue information. It describes what a part is and where it may fit.

### Operational stock

Jagports' mutable inventory. It describes what physical stock exists now.

### Vehicle evidence

Known vehicle identifiers, observations and source-backed configuration evidence.

Do not use GitHub files as the mutable inventory database.

## 4. Initial data model

```text
part_reference
  id
  part_number
  description
  source
  source_ref
  verification_status

stock_item
  id
  part_number
  quantity
  condition
  status
  location
  donor_vehicle
  source_ref
  notes
  created_at
  updated_at

vehicle
  id
  vin_raw
  serial
  model_range
  market
  identity_status
  notes
  created_at
  updated_at

vehicle_identifier
  id
  vehicle_id
  identifier_type
  location
  raw_value
  normalized_value
  source_ref
  verification_status
```

The schema is intentionally small. Later JEPC and knowledge tables can reference these stable entities without redesigning stock.

## 5. API MVP

```text
GET  /api/health
GET  /api/parts?q=<part number/text>
GET  /api/stock?q=<part number/text>
POST /api/stock
PATCH /api/stock/:id
DELETE /api/stock/:id
POST /api/vehicles
GET  /api/vehicles?q=<VIN/serial>
```

The current code retains `X-Admin-Token` as a temporary application-level authorization mechanism. The deployed private application must additionally be protected by Cloudflare Access before real inventory use. The token and all Cloudflare credentials remain deployment secrets and must never be committed to Git.

## 6. UI MVP

Single responsive application with four primary areas:

- **Vehicle** — enter VIN/identifier and inspect the current vehicle context.
- **Parts** — search part reference records.
- **Stock** — search, add and update physical inventory.
- **Status** — show API/database health and deployment information.

The UI should expose uncertainty rather than invent decoded vehicle attributes.

## 7. Development workflow

```text
GitHub Issue #280
      |
      v
feature branch
      |
      v
implementation + tests
      |
      v
Pull Request
      |
      v
Product Owner review
      |
      v
merge
      |
      v
Cloudflare deployment
```

This follows the repository's current Issue-driven lifecycle: Approved Issue → Codex → Implement → Test → Review → Merge → Close Issue → Done.

## 8. Deployment

Recommended first deployment:

1. Create Cloudflare Workers application.
2. Connect `jagports/jagports` through Cloudflare's Git integration.
3. Configure `4-Production/application/jagports-mvp/` as the Worker project root.
4. Create a D1 database.
5. Run the schema migration.
6. Set `ADMIN_TOKEN` as a Cloudflare secret.
7. Configure Cloudflare Access in front of the deployed application and require authentication.
8. Verify unauthenticated requests are denied by Access.
9. Verify health, part lookup and stock CRUD through the authenticated application.

The same Worker can serve static assets and API routes, avoiding separate frontend/backend hosting.

## 9. Free-tier operating envelope

Current Cloudflare Free limits used for this design:

| Resource | Free allowance | MVP implication |
|---|---:|---|
| Worker requests | 100,000/day | More than enough for a small private MVP |
| Worker CPU | 10 ms/invocation | Keep API handlers simple and indexed |
| D1 reads | 5,000,000 rows/day | Avoid full-table scans |
| D1 writes | 100,000 rows/day | Ample for normal inventory use |
| D1 database | 500 MB | Plenty for MVP operational data |
| D1 account storage | 5 GB | Ample for MVP |

If the application reaches these limits, the next step is optimization or a paid/runtime migration. Do not redesign the domain model merely because hosting changes.

## 10. Acceptance criteria

- Application runs locally with Cloudflare's local development tooling.
- Health endpoint returns OK.
- Part search works against D1 reference records.
- Stock can be created, searched, updated and deleted with admin authorization.
- Inventory survives application restart/redeploy because it is stored in D1.
- Vehicle records can be created and searched.
- No mutable inventory is stored in GitHub repository files.
- Tests catch schema/API regressions.
- Deployment instructions are complete.
- The MVP can later accept the real JEPC import without changing the stock model.
- Production application files are under `4-Production/application/jagports-mvp/`.
- Cloudflare Access is configured and unauthenticated application/API access is rejected before real inventory is exposed.

## 11. Future extension path

```text
MVP
 |
 +-- JEPC import
 |
 +-- VIN decoder
 |
 +-- A<groupId> attribute knowledge
 |
 +-- production/serial rules
 |
 +-- fitment constraint engine
 |
 +-- source/provenance graph
 |
 +-- diagram/hotspot support
 |
 +-- vehicle evidence corpus
 |
 +-- agent-assisted research
```
