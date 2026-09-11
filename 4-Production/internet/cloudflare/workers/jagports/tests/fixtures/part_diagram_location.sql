INSERT OR IGNORE INTO part (part_number_raw, part_number_normalized, description, source, source_ref, verification_status)
VALUES ('MJB7703AA', 'MJB7703AA', 'Fixture diagram/location part', 'fixture-diagram-location', 'fixture:part', 'fixture');

INSERT OR IGNORE INTO part_occurrence (part_id, source, source_ref, context_type, context_ref, category_ref, item_number, verification_status)
SELECT id, 'fixture-diagram-location', 'fixture:occurrence', 'epc', 'fixture-context', 'fixture-category', '12', 'fixture'
FROM part WHERE part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO diagram (source, source_ref, diagram_ref, title, image_ref, verification_status, confidence)
VALUES ('fixture-diagram-location', 'fixture:diagram', 'DGM-001', 'Fixture exploded diagram', 'fixture://diagram/DGM-001', 'fixture', 'fixture');

INSERT OR IGNORE INTO part_occurrence_diagram (part_occurrence_id, diagram_id)
SELECT po.id, d.id
FROM part_occurrence po CROSS JOIN diagram d
JOIN part p ON p.id = po.part_id
WHERE p.part_number_normalized = 'MJB7703AA' AND d.diagram_ref = 'DGM-001';

INSERT OR IGNORE INTO diagram_hotspot (diagram_id, part_occurrence_id, item_number, source_x, source_y, source_geometry, coordinate_system, source_ref, verification_status, confidence)
SELECT d.id, po.id, '12', 120.0, 80.0, NULL, 'fixture-stage-v1', 'fixture:hotspot:12', 'fixture', 'fixture'
FROM diagram d CROSS JOIN part_occurrence po
JOIN part p ON p.id = po.part_id
WHERE d.diagram_ref = 'DGM-001' AND p.part_number_normalized = 'MJB7703AA';

INSERT OR IGNORE INTO part_vehicle_location (part_occurrence_id, model_range_id, location_ref, system_ref, category_ref, mapping_state, source, source_ref, verification_status, confidence)
SELECT po.id, mr.id, 'front-engine-bay', 'cooling', 'radiator', 'verified', 'fixture-diagram-location', 'fixture:location:verified', 'fixture', 'fixture'
FROM part_occurrence po
JOIN part p ON p.id = po.part_id
CROSS JOIN model_range mr
WHERE p.part_number_normalized = 'MJB7703AA' AND mr.range_code = 'FIXTURE-XJ';

INSERT OR IGNORE INTO part_vehicle_location (part_occurrence_id, model_range_id, mapping_state, source, source_ref, verification_status, confidence)
SELECT po.id, mr.id, 'unavailable', 'fixture-diagram-location', 'fixture:location:unavailable', 'fixture', 'fixture'
FROM part_occurrence po
JOIN part p ON p.id = po.part_id
CROSS JOIN model_range mr
WHERE p.part_number_normalized = 'MJB7703AA' AND mr.range_code = 'FIXTURE-XK';
