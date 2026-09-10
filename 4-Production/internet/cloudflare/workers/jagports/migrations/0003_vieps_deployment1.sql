PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vehicle_range (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  range_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'fixture'
);

CREATE TABLE IF NOT EXISTS part_tree_node (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES part_tree_node(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_part_tree_parent ON part_tree_node(parent_id, sort_order);

CREATE TABLE IF NOT EXISTS part_tree_part (
  tree_node_id INTEGER NOT NULL REFERENCES part_tree_node(id) ON DELETE CASCADE,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  PRIMARY KEY (tree_node_id, part_id)
);
CREATE INDEX IF NOT EXISTS idx_part_tree_part_part ON part_tree_part(part_id);

CREATE TABLE IF NOT EXISTS part_image (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  image_url TEXT,
  image_kind TEXT NOT NULL DEFAULT 'representative',
  description TEXT,
  verification_status TEXT NOT NULL DEFAULT 'fixture'
);
CREATE INDEX IF NOT EXISTS idx_part_image_part ON part_image(part_id);

CREATE TABLE IF NOT EXISTS part_diagram (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  availability_status TEXT NOT NULL DEFAULT 'available',
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'fixture'
);
CREATE INDEX IF NOT EXISTS idx_part_diagram_part ON part_diagram(part_id);

CREATE TABLE IF NOT EXISTS part_fitment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  vehicle_range_id INTEGER NOT NULL REFERENCES vehicle_range(id) ON DELETE CASCADE,
  variation TEXT,
  qualifier TEXT,
  verification_status TEXT NOT NULL DEFAULT 'fixture'
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_part_fitment_unique
  ON part_fitment(part_id, vehicle_range_id, variation, qualifier);
CREATE INDEX IF NOT EXISTS idx_part_fitment_part ON part_fitment(part_id);
CREATE INDEX IF NOT EXISTS idx_part_fitment_range ON part_fitment(vehicle_range_id);
