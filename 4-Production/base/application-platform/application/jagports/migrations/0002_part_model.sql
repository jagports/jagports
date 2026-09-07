PRAGMA foreign_keys = ON;

-- Replace the MVP part_reference identity with the canonical PART model.
-- Existing part numbers are preserved verbatim as part_number_raw and
-- normalized for stable lookup. Invalid or colliding identities intentionally
-- fail the migration rather than silently dropping or merging catalogue data.
CREATE TABLE part_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  part_number_raw TEXT NOT NULL,
  part_number_normalized TEXT NOT NULL UNIQUE,
  description TEXT,
  source TEXT,
  source_ref TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
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

CREATE INDEX idx_part_number_normalized ON part(part_number_normalized);
CREATE INDEX idx_part_number_raw ON part(part_number_raw);
