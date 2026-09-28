PRAGMA foreign_keys = ON;

CREATE TABLE model_range (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  range_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  CHECK (TRIM(range_code) <> ''),
  CHECK (TRIM(name) <> '')
);

CREATE TABLE vin_range (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vin_prefix TEXT NOT NULL,
  serial_start TEXT NOT NULL,
  serial_end TEXT NOT NULL,
  model_year TEXT,
  production_boundary TEXT,
  market TEXT,
  body TEXT,
  engine_variant TEXT,
  emissions TEXT,
  transmission_steering TEXT,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  CHECK (TRIM(vin_prefix) <> ''),
  CHECK (TRIM(serial_start) <> ''),
  CHECK (TRIM(serial_end) <> '')
);
CREATE INDEX idx_vin_range_prefix_serial
  ON vin_range(vin_prefix, serial_start, serial_end);

CREATE TABLE part_model_range (
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  model_range_id INTEGER NOT NULL REFERENCES model_range(id) ON DELETE CASCADE,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  PRIMARY KEY (part_id, model_range_id)
);
CREATE INDEX idx_part_model_range_range
  ON part_model_range(model_range_id);

CREATE TABLE part_vin_range (
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  vin_range_id INTEGER NOT NULL REFERENCES vin_range(id) ON DELETE CASCADE,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  PRIMARY KEY (part_id, vin_range_id)
);
CREATE INDEX idx_part_vin_range_range
  ON part_vin_range(vin_range_id);
