PRAGMA foreign_keys = ON;

-- Persistent schema names describe domain semantics only. Deployment/release or
-- compatibility status must never leak into table names. Rebuild part_image in
-- place and use a migration-only temporary table that is dropped before commit.
ALTER TABLE part_image RENAME TO _part_image_migration_old;
DROP INDEX idx_part_image_part;

CREATE TABLE part_image (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_id INTEGER NOT NULL REFERENCES part(id) ON DELETE CASCADE,
  image_ref TEXT,
  image_kind TEXT NOT NULL DEFAULT 'representative',
  description TEXT,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  availability_status TEXT NOT NULL DEFAULT 'available',
  CHECK (image_ref IS NULL OR TRIM(image_ref) <> ''),
  CHECK (availability_status IN ('available', 'unavailable')),
  CHECK (image_ref IS NOT NULL OR availability_status = 'unavailable')
);

INSERT INTO part_image (
  id, part_id, image_ref, image_kind, description, verification_status, availability_status
)
SELECT
  id,
  part_id,
  image_url,
  image_kind,
  description,
  verification_status,
  CASE WHEN image_url IS NULL THEN 'unavailable' ELSE 'available' END
FROM _part_image_migration_old;

DROP TABLE _part_image_migration_old;

CREATE UNIQUE INDEX idx_part_image_identity
  ON part_image(part_id, image_ref)
  WHERE image_ref IS NOT NULL;
CREATE INDEX idx_part_image_part
  ON part_image(part_id);
CREATE INDEX idx_part_image_source
  ON part_image(source, source_ref);
