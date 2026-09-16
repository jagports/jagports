PRAGMA foreign_keys = ON;

-- Deterministic #666 fixture data for the production VIEPS API/UI path.
-- These rows are synthetic applicability evidence, not Jaguar catalogue facts.
-- Reuse the existing searchable fixture PARTs and vehicle ranges; do not add
-- schema or infer unresolved source semantics.

UPDATE part_fitment
SET applicability_state = 'applicable',
    source = 'fixture-666',
    source_ref = 'issue:#666:mjb7703aa:applicable',
    verification_status = 'fixture'
WHERE part_id = (SELECT id FROM part WHERE part_number_normalized = 'MJB7703AA')
  AND vehicle_range_id IN (SELECT id FROM vehicle_range WHERE range_code IN ('X100', 'X150'));

INSERT INTO part_fitment (
  part_id, vehicle_range_id, applicability_state, variation, qualifier,
  source, source_ref, verification_status
)
SELECT p.id, r.id, 'excluded', '4.0 Coupe', 'Deterministic excluded applicability fixture',
       'fixture-666', 'issue:#666:mna7691aa:excluded', 'fixture'
FROM part p
JOIN vehicle_range r ON r.range_code = 'X100'
WHERE p.part_number_normalized = 'MNA7691AA'
  AND NOT EXISTS (
    SELECT 1 FROM part_fitment f
    WHERE f.part_id = p.id AND f.vehicle_range_id = r.id
      AND f.variation = '4.0 Coupe'
      AND f.qualifier = 'Deterministic excluded applicability fixture'
  );

INSERT INTO part_fitment (
  part_id, vehicle_range_id, applicability_state, variation, qualifier,
  source, source_ref, verification_status
)
SELECT p.id, r.id, 'unavailable', '4.0 Coupe', 'Deterministic unavailable applicability fixture',
       'fixture-666', 'issue:#666:xr847031:unavailable', 'fixture'
FROM part p
JOIN vehicle_range r ON r.range_code = 'X150'
WHERE p.part_number_normalized = 'XR847031'
  AND NOT EXISTS (
    SELECT 1 FROM part_fitment f
    WHERE f.part_id = p.id AND f.vehicle_range_id = r.id
      AND f.variation = '4.0 Coupe'
      AND f.qualifier = 'Deterministic unavailable applicability fixture'
  );
