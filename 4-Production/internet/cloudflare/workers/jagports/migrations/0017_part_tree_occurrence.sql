PRAGMA foreign_keys = ON;

ALTER TABLE part_tree_node ADD COLUMN source_namespace TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_model_id TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_category_id TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_item_id TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_language TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_node_id TEXT;
ALTER TABLE part_tree_node ADD COLUMN parent_source_node_id TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_description TEXT;
ALTER TABLE part_tree_node ADD COLUMN source_order INTEGER;
ALTER TABLE part_tree_node ADD COLUMN source_ref TEXT;
ALTER TABLE part_tree_node ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';

CREATE UNIQUE INDEX idx_part_tree_source_node_identity
  ON part_tree_node(
    source_namespace,
    source_language,
    source_model_id,
    source_category_id,
    source_item_id,
    source_node_id
  )
  WHERE source_namespace IS NOT NULL
    AND source_language IS NOT NULL
    AND source_node_id IS NOT NULL;

CREATE INDEX idx_part_tree_source_parent
  ON part_tree_node(
    source_namespace,
    source_language,
    source_model_id,
    source_category_id,
    source_item_id,
    parent_source_node_id,
    source_order
  )
  WHERE source_namespace IS NOT NULL;

CREATE TABLE part_occurrence_tree_path (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_occurrence_id INTEGER NOT NULL REFERENCES part_occurrence(id) ON DELETE CASCADE,
  tree_node_id INTEGER NOT NULL REFERENCES part_tree_node(id) ON DELETE CASCADE,
  source_namespace TEXT NOT NULL CHECK (TRIM(source_namespace) <> ''),
  source_path_id TEXT NOT NULL CHECK (TRIM(source_path_id) <> ''),
  application_id TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  UNIQUE (source_namespace, source_path_id, part_occurrence_id, tree_node_id)
);

CREATE INDEX idx_part_occurrence_tree_path_occurrence
  ON part_occurrence_tree_path(part_occurrence_id);
CREATE INDEX idx_part_occurrence_tree_path_node
  ON part_occurrence_tree_path(tree_node_id);
CREATE INDEX idx_part_occurrence_tree_path_source
  ON part_occurrence_tree_path(source_namespace, source_path_id);
