PRAGMA foreign_keys = ON;
PRAGMA defer_foreign_keys = ON;

-- Widen operational stock vocabularies without rewriting migration 0011.
-- Rebuild the constrained tables and stock_item together so existing rows,
-- identifiers, relationships, indexes and triggers are preserved.

ALTER TABLE stock_item RENAME TO stock_item_0014_old;
ALTER TABLE stock_location RENAME TO stock_location_0014_old;
ALTER TABLE stock_source_party RENAME TO stock_source_party_0014_old;

CREATE TABLE stock_location (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES stock_site(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES stock_location(id) ON DELETE CASCADE,
  location_type TEXT NOT NULL CHECK (location_type IN ('rack', 'shelf', 'box')),
  name TEXT NOT NULL CHECK (TRIM(name) <> ''),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE stock_source_party (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK (source_type IN ('vendor', 'person', 'organization', 'tenant', 'other')),
  name TEXT NOT NULL CHECK (TRIM(name) <> ''),
  source_ref TEXT
);

CREATE TABLE stock_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
  condition TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'available',
  location TEXT,
  donor_vehicle TEXT,
  source_ref TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  part_id INTEGER REFERENCES part(id) ON DELETE SET NULL,
  donor_vehicle_id INTEGER REFERENCES vehicle(id) ON DELETE SET NULL,
  source TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  confidence REAL,
  available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1)),
  condition_code TEXT CHECK (condition_code IN ('A', 'B', 'C', 'D', 'E')),
  storage_location_id INTEGER REFERENCES stock_location(id) ON DELETE SET NULL,
  source_party_id INTEGER REFERENCES stock_source_party(id) ON DELETE SET NULL,
  price NUMERIC CHECK (price IS NULL OR price >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR'
    CHECK (LENGTH(TRIM(currency)) = 3 AND currency = UPPER(currency))
);

INSERT INTO stock_location (id, site_id, parent_id, location_type, name)
SELECT id, site_id, parent_id, location_type, name
FROM stock_location_0014_old;

INSERT INTO stock_source_party (id, source_type, name, source_ref)
SELECT id, source_type, name, source_ref
FROM stock_source_party_0014_old;

INSERT INTO stock_item (
  id, part_number, quantity, condition, status, location, donor_vehicle,
  source_ref, notes, created_at, updated_at, part_id, donor_vehicle_id, source,
  verification_status, confidence, available, condition_code,
  storage_location_id, source_party_id, price, currency
)
SELECT
  id, part_number, quantity, condition, status, location, donor_vehicle,
  source_ref, notes, created_at, updated_at, part_id, donor_vehicle_id, source,
  verification_status, confidence, available, condition_code,
  storage_location_id, source_party_id, price, currency
FROM stock_item_0014_old;

-- Remove the old dependent table before the old parent tables.
DROP TABLE stock_item_0014_old;
DROP TABLE stock_location_0014_old;
DROP TABLE stock_source_party_0014_old;

CREATE INDEX idx_stock_item_part_number ON stock_item(part_number);
CREATE INDEX idx_stock_item_status ON stock_item(status);
CREATE INDEX idx_stock_item_location ON stock_item(location);
CREATE INDEX idx_stock_item_part_id ON stock_item(part_id);
CREATE INDEX idx_stock_item_available ON stock_item(available);
CREATE INDEX idx_stock_item_donor_vehicle ON stock_item(donor_vehicle_id);
CREATE INDEX idx_stock_item_source ON stock_item(source);
CREATE INDEX idx_stock_item_condition_code ON stock_item(condition_code);
CREATE INDEX idx_stock_item_storage_location ON stock_item(storage_location_id);
CREATE INDEX idx_stock_item_source_party ON stock_item(source_party_id);
CREATE INDEX idx_stock_item_price_currency ON stock_item(currency, price);

CREATE UNIQUE INDEX idx_stock_location_root_identity
  ON stock_location(site_id, name)
  WHERE parent_id IS NULL;
CREATE UNIQUE INDEX idx_stock_location_child_identity
  ON stock_location(parent_id, name)
  WHERE parent_id IS NOT NULL;
CREATE INDEX idx_stock_location_site ON stock_location(site_id);
CREATE INDEX idx_stock_location_parent ON stock_location(parent_id);

CREATE INDEX idx_stock_source_party_type_name
  ON stock_source_party(source_type, name);

CREATE TRIGGER stock_item_quantity_integer_insert
BEFORE INSERT ON stock_item
WHEN typeof(NEW.quantity) <> 'integer'
BEGIN
  SELECT RAISE(ABORT, 'stock quantity must be an integer');
END;

CREATE TRIGGER stock_item_quantity_integer_update
BEFORE UPDATE OF quantity ON stock_item
WHEN typeof(NEW.quantity) <> 'integer'
BEGIN
  SELECT RAISE(ABORT, 'stock quantity must be an integer');
END;

CREATE TRIGGER stock_item_available_integrity_insert
BEFORE INSERT ON stock_item
WHEN NEW.available = 1
 AND (NEW.condition_code IS NULL OR NEW.storage_location_id IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'available stock requires condition and storage location');
END;

CREATE TRIGGER stock_item_available_integrity_update
BEFORE UPDATE OF available, condition_code, storage_location_id ON stock_item
WHEN NEW.available = 1
 AND (NEW.condition_code IS NULL OR NEW.storage_location_id IS NULL)
BEGIN
  SELECT RAISE(ABORT, 'available stock requires condition and storage location');
END;

CREATE TRIGGER stock_item_unresolved_source_insert
BEFORE INSERT ON stock_item
WHEN NEW.part_id IS NULL
 AND NEW.source_party_id IS NULL
 AND (NEW.source IS NULL OR TRIM(NEW.source) = '')
BEGIN
  SELECT RAISE(ABORT, 'unresolved stock requires source evidence');
END;

CREATE TRIGGER stock_item_unresolved_source_update
BEFORE UPDATE OF part_id, source_party_id, source ON stock_item
WHEN NEW.part_id IS NULL
 AND NEW.source_party_id IS NULL
 AND (NEW.source IS NULL OR TRIM(NEW.source) = '')
BEGIN
  SELECT RAISE(ABORT, 'unresolved stock requires source evidence');
END;
