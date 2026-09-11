PRAGMA foreign_keys = ON;

-- 0003 already created a different, Deployment-1 presentation table.
-- Preserve its rows (including unavailable image placeholders) without
-- inventing canonical image references or discarding source evidence.
ALTER TABLE part_image RENAME TO deployment1_part_image;
DROP INDEX idx_part_image_part;
CREATE INDEX idx_deployment1_part_image_part ON deployment1_part_image(part_id);

CREATE TABLE part_image (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  image_ref TEXT NOT NULL,
  source TEXT,
  source_ref TEXT,
  description TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  CHECK (TRIM(image_ref) <> '')
);

CREATE UNIQUE INDEX idx_part_image_identity
  ON part_image(part_id, image_ref);
CREATE INDEX idx_part_image_part
  ON part_image(part_id);
CREATE INDEX idx_part_image_source
  ON part_image(source, source_ref);
