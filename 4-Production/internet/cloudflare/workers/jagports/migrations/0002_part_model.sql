PRAGMA foreign_keys = ON;

-- Replace the MVP part_reference identity with the canonical PART model.
-- A PART may exist before a catalogue part number is known. The internal id
-- is the stable identity; when a part number is known, its normalized form is
-- unique. Invalid or colliding identities intentionally fail the migration
-- rather than silently dropping or merging catalogue data.
CREATE TABLE part_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number_raw TEXT,
  part_number_normalized TEXT,
  description TEXT,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  CHECK (part_number_raw IS NULL OR TRIM(part_number_raw) <> ''),
  CHECK (part_number_normalized IS NULL OR TRIM(part_number_normalized) <> '')
);

INSERT INTO part_new (
  id,
  part_number_raw,
  part_number_normalized,
  description,
  source,
  source_ref,
  verification_status
)
SELECT
  id,
  part_number,
  NULLIF(
    UPPER(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(TRIM(part_number), ' ', ''),
              '-', ''
            ),
            char(9), ''
          ),
          char(10), ''
        ),
        char(13), ''
      )
    ),
    ''
  ),
  description,
  source,
  source_ref,
  verification_status
FROM part_reference;

DROP TABLE part_reference;
ALTER TABLE part_new RENAME TO part;

CREATE UNIQUE INDEX idx_part_number_normalized_unique
  ON part(part_number_normalized)
  WHERE part_number_normalized IS NOT NULL;
CREATE INDEX idx_part_number_raw ON part(part_number_raw);
