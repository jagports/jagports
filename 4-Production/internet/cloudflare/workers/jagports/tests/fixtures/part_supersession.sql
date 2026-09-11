PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO part (
  part_number_raw, part_number_normalized, description, source, source_ref, verification_status
) VALUES
  ('MNA7691AA', 'MNA7691AA', 'Fan Warning Label', 'fixture-supersession', 'supersession-001', 'fixture'),
  ('XR847031', 'XR847031', 'Fan Warning Label Replacement', 'fixture-supersession', 'supersession-002', 'fixture'),
  ('FIX-A', 'FIX-A', 'Supersession Chain A', 'fixture-supersession', 'chain-a', 'fixture'),
  ('FIX-B', 'FIX-B', 'Supersession Chain B', 'fixture-supersession', 'chain-b', 'fixture'),
  ('FIX-C', 'FIX-C', 'Supersession Chain C', 'fixture-supersession', 'chain-c', 'fixture');

INSERT OR IGNORE INTO part_supersession (
  superseded_part_id, superseding_part_id, source, source_ref, verification_status, confidence
)
SELECT p_old.id, p_new.id, 'fixture-supersession', 'mna7691aa-xr847031', 'fixture', 'fixture'
FROM part p_old
CROSS JOIN part p_new
WHERE p_old.part_number_normalized = 'MNA7691AA'
  AND p_new.part_number_normalized = 'XR847031';

INSERT OR IGNORE INTO part_supersession (
  superseded_part_id, superseding_part_id, source, source_ref, verification_status, confidence
)
SELECT p_old.id, p_new.id, 'fixture-supersession', 'chain-a-b', 'fixture', 'fixture'
FROM part p_old
CROSS JOIN part p_new
WHERE p_old.part_number_normalized = 'FIX-A'
  AND p_new.part_number_normalized = 'FIX-B';

INSERT OR IGNORE INTO part_supersession (
  superseded_part_id, superseding_part_id, source, source_ref, verification_status, confidence
)
SELECT p_old.id, p_new.id, 'fixture-supersession', 'chain-b-c', 'fixture', 'fixture'
FROM part p_old
CROSS JOIN part p_new
WHERE p_old.part_number_normalized = 'FIX-B'
  AND p_new.part_number_normalized = 'FIX-C';
