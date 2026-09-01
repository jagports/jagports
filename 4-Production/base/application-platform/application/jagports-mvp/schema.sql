PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS part_reference (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number TEXT NOT NULL UNIQUE,
  description TEXT,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
);
CREATE INDEX IF NOT EXISTS idx_part_reference_part_number ON part_reference(part_number);

CREATE TABLE IF NOT EXISTS stock_item (
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
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stock_item_part_number ON stock_item(part_number);
CREATE INDEX IF NOT EXISTS idx_stock_item_status ON stock_item(status);
CREATE INDEX IF NOT EXISTS idx_stock_item_location ON stock_item(location);

CREATE TABLE IF NOT EXISTS vehicle (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin_raw TEXT,
  serial TEXT,
  model_range TEXT,
  market TEXT,
  identity_status TEXT NOT NULL DEFAULT 'unresolved',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vehicle_vin_raw ON vehicle(vin_raw);
CREATE INDEX IF NOT EXISTS idx_vehicle_serial ON vehicle(serial);

CREATE TABLE IF NOT EXISTS vehicle_identifier (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL,
  location TEXT,
  raw_value TEXT NOT NULL,
  normalized_value TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
);
CREATE INDEX IF NOT EXISTS idx_vehicle_identifier_normalized ON vehicle_identifier(normalized_value);
