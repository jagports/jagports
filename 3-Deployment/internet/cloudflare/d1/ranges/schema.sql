PRAGMA foreign_keys = ON;

-- JEPC Range partition. This is schema only: no fixtures or operational STOCK.
CREATE TABLE IF NOT EXISTS range_identity (
  range_slug TEXT PRIMARY KEY,
  database_name TEXT NOT NULL,
  schema_version INTEGER NOT NULL CHECK (schema_version = 1)
);

CREATE TABLE IF NOT EXISTS part (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  canonical_key TEXT NOT NULL UNIQUE,
  part_number_raw TEXT NOT NULL,
  part_number_normalized TEXT NOT NULL UNIQUE,
  description TEXT,
  source_origin TEXT NOT NULL CHECK (source_origin = 'ImportJEPC'),
  source TEXT NOT NULL,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
);

CREATE TABLE IF NOT EXISTS part_tree_node (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER REFERENCES part_tree_node(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_namespace TEXT NOT NULL,
  source_model_id TEXT NOT NULL,
  source_category_id TEXT NOT NULL DEFAULT '',
  source_item_id TEXT NOT NULL DEFAULT '',
  source_language TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  parent_source_node_id TEXT,
  source_description TEXT,
  source_order INTEGER,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  UNIQUE(source_namespace,source_language,source_model_id,source_category_id,source_item_id,source_node_id)
);
CREATE INDEX IF NOT EXISTS idx_range_tree_parent ON part_tree_node(parent_id,sort_order);

CREATE TABLE IF NOT EXISTS part_tree_part (
  tree_node_id INTEGER NOT NULL REFERENCES part_tree_node(id) ON DELETE CASCADE,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  PRIMARY KEY(tree_node_id,part_id)
);

CREATE TABLE IF NOT EXISTS part_occurrence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id),
  source TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'epc',
  context_ref TEXT NOT NULL,
  category_ref TEXT NOT NULL,
  item_number TEXT NOT NULL,
  diagram_ref TEXT,
  diagram_item_number TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  UNIQUE(source,source_ref)
);
CREATE INDEX IF NOT EXISTS idx_range_occurrence_part ON part_occurrence(part_id);
CREATE INDEX IF NOT EXISTS idx_range_occurrence_context ON part_occurrence(context_ref);

CREATE TABLE IF NOT EXISTS part_occurrence_tree_path (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_occurrence_id INTEGER NOT NULL REFERENCES part_occurrence(id) ON DELETE CASCADE,
  tree_node_id INTEGER NOT NULL REFERENCES part_tree_node(id) ON DELETE CASCADE,
  source_namespace TEXT NOT NULL,
  source_path_id TEXT NOT NULL,
  application_id TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  UNIQUE(source_namespace,source_path_id,part_occurrence_id,tree_node_id)
);

CREATE TABLE IF NOT EXISTS jepc_occurrence_evidence (
  part_occurrence_id INTEGER PRIMARY KEY REFERENCES part_occurrence(id) ON DELETE CASCADE,
  source_file_sha256 TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  parent_source_node_id TEXT NOT NULL,
  top_level_description TEXT,
  source_conditions_json TEXT NOT NULL,
  applicability_evidence_json TEXT NOT NULL,
  raw_row TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS jepc_unresolved_leaf (
  source_path TEXT PRIMARY KEY,
  context_ref TEXT NOT NULL,
  raw_part_number TEXT,
  source_file_sha256 TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  application_id TEXT,
  source_conditions_json TEXT NOT NULL,
  applicability_evidence_json TEXT NOT NULL,
  raw_row TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jepc_unresolved_context ON jepc_unresolved_leaf(context_ref);

CREATE TABLE IF NOT EXISTS jepc_bundle (
  model_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  language_id TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  source_parent_id TEXT,
  source_model_label TEXT NOT NULL,
  source_category_label TEXT NOT NULL,
  source_breadcrumb TEXT,
  published_at TEXT NOT NULL,
  PRIMARY KEY(model_id,category_id,language_id)
);
