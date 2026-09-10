PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO vehicle_range (range_code, name, verification_status)
VALUES
  ('X100', 'XK8 / X100', 'fixture'),
  ('X150', 'XK / X150', 'fixture');

INSERT OR IGNORE INTO part (part_number_raw, part_number_normalized, description, source, source_ref, verification_status)
VALUES
  ('MJB7703AA', 'MJB7703AA', 'Representative Deployment-1 part', 'Deployment-1 fixture', 'fixture:deployment1:mjb7703aa', 'fixture'),
  (NULL, NULL, 'firtree1', 'Deployment-1 fixture', 'fixture:deployment1:firtree1', 'fixture'),
  (NULL, NULL, 'firtree2', 'Deployment-1 fixture', 'fixture:deployment1:firtree2', 'fixture');

INSERT OR IGNORE INTO part_tree_node (id, parent_id, label, sort_order)
VALUES
  (1, NULL, 'Body', 10),
  (2, 1, 'Exterior', 10),
  (3, 2, 'Clips and Fasteners', 10);

INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id)
SELECT 3, id FROM part WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id)
SELECT 3, id FROM part WHERE description IN ('firtree1', 'firtree2');

INSERT OR IGNORE INTO part_image (part_id, image_url, image_kind, description, verification_status)
SELECT id, NULL, 'representative', 'Representative part image not yet available', 'fixture'
FROM part
WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO part_image (part_id, image_url, image_kind, description, verification_status)
SELECT id, NULL, 'identification', 'Identification image not yet available', 'fixture'
FROM part
WHERE description IN ('firtree1', 'firtree2');

INSERT OR IGNORE INTO part_diagram (part_id, title, image_url, availability_status, source_ref, verification_status)
SELECT id, 'Representative Deployment-1 exploded context', NULL, 'unavailable', 'fixture:deployment1:diagram', 'fixture'
FROM part
WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO part_fitment (part_id, vehicle_range_id, variation, qualifier, verification_status)
SELECT p.id, r.id, '4.0 Coupe', 'Representative fixture applicability', 'fixture'
FROM part p CROSS JOIN vehicle_range r
WHERE p.part_number_normalized = 'MJB7703AA' AND r.range_code IN ('X100', 'X150');

INSERT OR IGNORE INTO part_fitment (part_id, vehicle_range_id, variation, qualifier, verification_status)
SELECT p.id, r.id, '4.0 Convertible', 'Representative fixture applicability', 'fixture'
FROM part p CROSS JOIN vehicle_range r
WHERE p.part_number_normalized = 'MJB7703AA' AND r.range_code IN ('X100', 'X150');
