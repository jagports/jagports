PRAGMA foreign_keys = ON;

-- Complete the operational-stock semantics without adding transaction history
-- or individual physical-unit identity.

CREATE TABLE stock_site (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE CHECK (TRIM(name) <> '')
);

CREATE TABLE stock_location (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id INTEGER NOT NULL REFERENCES stock_site(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES stock_location(id) ON DELETE CASCADE,
  location_type TEXT NOT NULL CHECK (location_type IN ('rack', 'shelf', 'box')),
  name TEXT NOT NULL CHECK (TRIM(name) <> ''),
  CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE UNIQUE INDEX idx_stock_location_root_identity
  ON stock_location(site_id, name)
  WHERE parent_id IS NULL;
CREATE UNIQUE INDEX idx_stock_location_child_identity
  ON stock_location(parent_id, name)
  WHERE parent_id IS NOT NULL;
CREATE INDEX idx_stock_location_site ON stock_location(site_id);
CREATE INDEX idx_stock_location_parent ON stock_location(parent_id);

CREATE TABLE stock_source_party (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK (source_type IN ('vendor', 'person', 'organization', 'tenant', 'other')),
  name TEXT NOT NULL CHECK (TRIM(name) <> ''),
  source_ref TEXT
);

CREATE INDEX idx_stock_source_party_type_name
  ON stock_source_party(source_type, name);

ALTER TABLE stock_item ADD COLUMN condition_code TEXT
  CHECK (condition_code IN ('A', 'B', 'C', 'D', 'E'));
ALTER TABLE stock_item ADD COLUMN storage_location_id INTEGER
  REFERENCES stock_location(id) ON DELETE SET NULL;
ALTER TABLE stock_item ADD COLUMN source_party_id INTEGER
  REFERENCES stock_source_party(id) ON DELETE SET NULL;
ALTER TABLE stock_item ADD COLUMN price NUMERIC CHECK (price IS NULL OR price >= 0);
ALTER TABLE stock_item ADD COLUMN currency TEXT NOT NULL DEFAULT 'EUR'
  CHECK (LENGTH(TRIM(currency)) = 3 AND currency = UPPER(currency));

CREATE INDEX idx_stock_item_condition_code ON stock_item(condition_code);
CREATE INDEX idx_stock_item_storage_location ON stock_item(storage_location_id);
CREATE INDEX idx_stock_item_source_party ON stock_item(source_party_id);
CREATE INDEX idx_stock_item_price_currency ON stock_item(currency, price);

-- SQLite INTEGER affinity alone can retain fractional numeric input. Enforce the
-- accepted physical-item count contract on new/changed stock records.
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

-- Available means inventoried stock whose accepted condition and physical
-- storage location are known. Existing rows are not guessed/backfilled; the
-- rule applies when rows are inserted or these fields are changed.
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

-- An unresolved/non-catalogue stock record must retain usable acquisition/source
-- evidence rather than fabricating a PART identity. Legacy stock_item.source is
-- accepted as evidence; normalized party identity is preferred when known.
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
