PRAGMA foreign_keys = ON;

-- A catalogue PART is stable identity. A PART OCCURRENCE records one
-- source/application context in which that PART appears without duplicating
-- the catalogue identity.
CREATE TABLE part_occurrence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  source_ref TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'epc',
  context_ref TEXT,
  category_ref TEXT,
  item_number TEXT,
  diagram_ref TEXT,
  diagram_item_number TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  CHECK (TRIM(source) <> ''),
  CHECK (TRIM(source_ref) <> ''),
  CHECK (TRIM(context_type) <> '')
);

CREATE UNIQUE INDEX idx_part_occurrence_identity
  ON part_occurrence(part_id, source, source_ref);
CREATE INDEX idx_part_occurrence_part
  ON part_occurrence(part_id);
CREATE INDEX idx_part_occurrence_context
  ON part_occurrence(context_type, context_ref);
CREATE INDEX idx_part_occurrence_diagram
  ON part_occurrence(diagram_ref, diagram_item_number);
