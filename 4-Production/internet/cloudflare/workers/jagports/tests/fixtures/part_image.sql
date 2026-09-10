PRAGMA foreign_keys = ON;

-- Representative unidentified PART: no catalogue number is required for image evidence.
INSERT OR IGNORE INTO part (
  part_number_raw,
  part_number_normalized,
  description,
  source,
  source_ref,
  verification_status
) VALUES (
  NULL,
  NULL,
  'Fir tree clip',
  'fixture-image',
  'part-image-fixture-001',
  'unverified'
);

INSERT INTO part_image (
  part_id,
  image_ref,
  source,
  source_ref,
  description,
  verification_status
)
SELECT id, 'image-001', 'fixture-image', 'image-source-001', 'Front view', 'fixture'
FROM part
WHERE source = 'fixture-image' AND source_ref = 'part-image-fixture-001';

INSERT INTO part_image (
  part_id,
  image_ref,
  source,
  source_ref,
  description,
  verification_status
)
SELECT id, 'image-002', 'fixture-image', 'image-source-002', 'Side view', 'fixture'
FROM part
WHERE source = 'fixture-image' AND source_ref = 'part-image-fixture-001';
