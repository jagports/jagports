-- Synthetic, isolated Parts Model acceptance graph, not real inventory or VIN evidence.
-- Load once after all migrations (may coexist with part_presentation.sql).
INSERT INTO part (id, part_number_raw, part_number_normalized, description, source, source_ref, verification_status) VALUES
  (53801, 'MNA 7691-AA', 'MNA7691AA', 'Fan Warning Label', 'fixture', 'fixture:538:old', 'fixture'),
  (53802, 'XR847031', 'XR847031', 'Replacement label', 'fixture', 'fixture:538:replacement', 'fixture'),
  (53803, 'FIX538C', 'FIX538C', 'Synthetic chain endpoint', 'fixture', 'fixture:538:chain', 'fixture'),
  (53804, NULL, NULL, 'Unidentified clip', 'fixture', 'fixture:538:clip', 'unverified'),
  (53805, NULL, NULL, 'Unidentified clip', 'fixture', 'fixture:538:other-clip', 'unverified');
INSERT INTO part_occurrence (id, part_id, source, source_ref, context_type, context_ref, category_ref, item_number, diagram_ref, diagram_item_number) VALUES
  (53811, 53801, 'fixture', 'fixture:538:occurrence:a', 'epc', 'context-a', 'labels', '12', 'D538', '12'),
  (53812, 53801, 'fixture', 'fixture:538:occurrence:b', 'epc', 'context-b', NULL, '7', NULL, NULL);
INSERT INTO part_image (id, part_id, image_ref, source, source_ref) VALUES
  (53821, 53804, 'fixture:image:front', 'fixture', 'fixture:538:image:front'),
  (53822, 53804, 'fixture:image:side', 'fixture', 'fixture:538:image:side');
INSERT INTO model_range (id, range_code, name, source, source_ref) VALUES
  (53831, 'FIX538-X100', 'Synthetic X100 range', 'fixture', 'fixture:538:model');
INSERT INTO vin_range (id, vin_prefix, serial_start, serial_end, model_year, production_boundary, market, body, engine_variant, emissions, transmission_steering, source, source_ref) VALUES
  (53841, 'SAJJG', '001001', '008105', '1996', '1996-02', 'ROW', 'coupe', '4.0L N/A', NULL, NULL, 'fixture', 'fixture:538:vin');
INSERT INTO part_model_range (part_id, model_range_id, source, source_ref) VALUES (53801, 53831, 'fixture', 'fixture:538:part-model');
INSERT INTO part_vin_range (part_id, vin_range_id, source, source_ref) VALUES (53801, 53841, 'fixture', 'fixture:538:part-vin');
INSERT INTO part_supersession (superseded_part_id, superseding_part_id, source, source_ref, confidence, effective_from, effective_to) VALUES
  (53801, 53802, 'fixture', 'fixture:538:replacement:a-b', 'fixture', '2000-01', NULL),
  (53802, 53803, 'fixture', 'fixture:538:replacement:b-c', NULL, NULL, NULL),
  (53805, 53802, 'fixture', 'fixture:538:replacement:many-to-one', NULL, NULL, NULL);
INSERT INTO part_fitment (id, part_occurrence_id, applicability_state, attribute_group, attribute_key, source_value, except_flag, source, source_ref, confidence) VALUES
  (53851, 53811, 'applicable', 'source-group', 'source-key', '4.0', NULL, 'fixture', 'fixture:538:fitment:positive', 'fixture'),
  (53852, 53811, 'excluded', 'source-group', 'source-key', 'convertible', '1', 'fixture', 'fixture:538:fitment:excluded', NULL),
  (53853, 53812, 'unavailable', NULL, NULL, NULL, NULL, 'fixture', 'fixture:538:fitment:unavailable', NULL);
INSERT INTO diagram (id, source, source_ref, diagram_ref, image_ref) VALUES
  (53861, 'fixture', 'fixture:538:diagram', 'D538', NULL);
INSERT INTO part_occurrence_diagram VALUES (53811, 53861), (53812, 53861);
INSERT INTO diagram_hotspot (id, diagram_id, part_occurrence_id, item_number, source_x, source_y, source_geometry, coordinate_system, source_ref) VALUES
  (53871, 53861, 53811, '12', 0, -1, NULL, 'fixture-stage', 'fixture:538:hotspot'),
  (53872, 53861, NULL, 'unknown', NULL, NULL, 'opaque-source-geometry', 'fixture-stage', 'fixture:538:unmapped-hotspot');
INSERT INTO part_vehicle_location (id, part_occurrence_id, model_range_id, location_ref, system_ref, category_ref, mapping_state, source, source_ref) VALUES
  (53881, 53811, 53831, 'fixture:zone', 'fixture:system', 'fixture:category', 'verified', 'fixture', 'fixture:538:location'),
  (53882, 53812, NULL, NULL, NULL, NULL, 'unavailable', 'fixture', 'fixture:538:no-location');
INSERT INTO vehicle (id, vin_raw, serial, model_range, identity_status) VALUES
  (53891, 'SAJJNADW3TJ123456', 'TJ123456', 'fixture:donor-range', 'unresolved');
INSERT INTO vehicle_identifier (id, vehicle_id, identifier_type, raw_value, normalized_value, source_ref) VALUES
  (53892, 53891, 'vin', 'SAJJNADW3TJ123456', 'SAJJNADW3TJ123456', 'fixture:538:donor');
INSERT INTO stock_item (id, part_number, part_id, donor_vehicle_id, quantity, condition, status, location, donor_vehicle, source, source_ref, available, confidence) VALUES
  (53901, 'MNA 7691-AA', 53801, 53891, 3, 'used', 'available', 'BIN-A1', 'source donor text', 'fixture', 'fixture:538:stock:a', 1, 1.0),
  (53902, 'MNA7691AA', 53801, NULL, 1, 'new', 'reserved', 'BIN-B2', NULL, 'fixture', 'fixture:538:stock:b', 0, NULL),
  (53903, 'UNKNOWN-CLIP', NULL, NULL, 0, 'unknown', 'available', NULL, NULL, 'fixture', 'fixture:538:stock:unresolved', 1, NULL);
