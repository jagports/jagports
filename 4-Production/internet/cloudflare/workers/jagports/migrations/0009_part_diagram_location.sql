PRAGMA foreign_keys = ON;

CREATE TABLE diagram (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  source_ref TEXT,
  diagram_ref TEXT NOT NULL,
  title TEXT,
  image_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  confidence TEXT,
  CHECK (TRIM(diagram_ref) <> '')
);

CREATE UNIQUE INDEX idx_diagram_identity
  ON diagram(source, source_ref, diagram_ref);

CREATE TABLE part_occurrence_diagram (
  part_occurrence_id INTEGER NOT NULL REFERENCES part_occurrence(id) ON DELETE CASCADE,
  diagram_id INTEGER NOT NULL REFERENCES diagram(id) ON DELETE CASCADE,
  PRIMARY KEY (part_occurrence_id, diagram_id)
);

CREATE INDEX idx_part_occurrence_diagram_diagram
  ON part_occurrence_diagram(diagram_id);

CREATE TABLE diagram_hotspot (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diagram_id INTEGER NOT NULL REFERENCES diagram(id) ON DELETE CASCADE,
  part_occurrence_id INTEGER REFERENCES part_occurrence(id) ON DELETE SET NULL,
  item_number TEXT,
  source_x REAL,
  source_y REAL,
  source_geometry TEXT,
  coordinate_system TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  confidence TEXT,
  CHECK (item_number IS NULL OR TRIM(item_number) <> ''),
  CHECK (coordinate_system IS NULL OR TRIM(coordinate_system) <> ''),
  CHECK (source_geometry IS NOT NULL OR (source_x IS NOT NULL AND source_y IS NOT NULL))
);

CREATE INDEX idx_diagram_hotspot_diagram
  ON diagram_hotspot(diagram_id);
CREATE INDEX idx_diagram_hotspot_occurrence
  ON diagram_hotspot(part_occurrence_id);
CREATE INDEX idx_diagram_hotspot_item
  ON diagram_hotspot(diagram_id, item_number);

CREATE TABLE part_vehicle_location (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_occurrence_id INTEGER NOT NULL REFERENCES part_occurrence(id) ON DELETE CASCADE,
  model_range_id INTEGER REFERENCES model_range(id) ON DELETE CASCADE,
  location_ref TEXT,
  system_ref TEXT,
  category_ref TEXT,
  mapping_state TEXT NOT NULL DEFAULT 'unavailable',
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  confidence TEXT,
  CHECK (mapping_state IN ('verified', 'unavailable')),
  CHECK (location_ref IS NULL OR TRIM(location_ref) <> ''),
  CHECK (system_ref IS NULL OR TRIM(system_ref) <> ''),
  CHECK (category_ref IS NULL OR TRIM(category_ref) <> ''),
  CHECK (mapping_state = 'unavailable' OR location_ref IS NOT NULL)
);

CREATE UNIQUE INDEX idx_part_vehicle_location_identity
  ON part_vehicle_location(part_occurrence_id, model_range_id, location_ref, system_ref, category_ref);
CREATE INDEX idx_part_vehicle_location_model
  ON part_vehicle_location(model_range_id);
CREATE INDEX idx_part_vehicle_location_state
  ON part_vehicle_location(mapping_state);
