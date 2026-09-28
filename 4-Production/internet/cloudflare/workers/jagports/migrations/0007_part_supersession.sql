PRAGMA foreign_keys = ON;

CREATE TABLE part_supersession (
  superseded_part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  superseding_part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  confidence TEXT,
  effective_from TEXT,
  effective_to TEXT,
  PRIMARY KEY (superseded_part_id, superseding_part_id),
  CHECK (superseded_part_id <> superseding_part_id)
);

CREATE INDEX idx_part_supersession_superseding
  ON part_supersession(superseding_part_id);
CREATE INDEX idx_part_supersession_superseded
  ON part_supersession(superseded_part_id);
