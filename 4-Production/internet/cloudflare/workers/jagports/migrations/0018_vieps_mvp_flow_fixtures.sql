PRAGMA foreign_keys = ON;

-- Deterministic #544/#545 fixture evidence for the production VIEPS UI path.
-- These rows are synthetic test/demo data, not Jaguar catalogue facts.

INSERT INTO part_fitment (
  part_id, vehicle_range_id, applicability_state, variation, qualifier,
  source, source_ref, verification_status
)
SELECT p.id, r.id, 'excluded', 'Excluded fixture variation', 'Deterministic excluded variation fixture',
       'fixture-544', 'issue:#544:mjb7703aa:x100:excluded', 'fixture'
FROM part p
JOIN vehicle_range r ON r.range_code = 'X100'
WHERE p.part_number_normalized = 'MJB7703AA'
  AND NOT EXISTS (
    SELECT 1 FROM part_fitment f
    WHERE f.part_id = p.id AND f.vehicle_range_id = r.id
      AND f.variation = 'Excluded fixture variation'
  );

INSERT INTO part_fitment (
  part_id, vehicle_range_id, applicability_state, variation, qualifier,
  source, source_ref, verification_status
)
SELECT p.id, r.id, 'unavailable', 'Unavailable fixture variation', 'Deterministic unavailable variation fixture',
       'fixture-544', 'issue:#544:mjb7703aa:x100:unavailable', 'fixture'
FROM part p
JOIN vehicle_range r ON r.range_code = 'X100'
WHERE p.part_number_normalized = 'MJB7703AA'
  AND NOT EXISTS (
    SELECT 1 FROM part_fitment f
    WHERE f.part_id = p.id AND f.vehicle_range_id = r.id
      AND f.variation = 'Unavailable fixture variation'
  );

UPDATE part_image
SET image_ref = '/fixtures/mjb7703aa.svg',
    description = 'Representative verified fixture Part Image',
    source = 'fixture-545',
    source_ref = 'issue:#545:mjb7703aa:image',
    verification_status = 'fixture',
    availability_status = 'available'
WHERE part_id = (SELECT id FROM part WHERE part_number_normalized = 'MJB7703AA')
  AND image_kind = 'representative';
