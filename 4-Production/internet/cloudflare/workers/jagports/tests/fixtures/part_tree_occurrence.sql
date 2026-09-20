-- Synthetic source-qualified catalogue-tree persistence fixture for #835.
-- It demonstrates structure and identity only; labels are not domain claims.

INSERT INTO part_tree_node (
  id, parent_id, label, sort_order,
  source_namespace, source_model_id, source_category_id, source_item_id,
  source_language, source_node_id, parent_source_node_id,
  source_description, source_order, source_ref, verification_status
) VALUES
  (83501, NULL, 'XK8 source model', 10,
   'JEPC', 'M3187', 'C8450', 'I8', 'en', 'N1', NULL,
   'XK8 source model', 1, 'fixture:835:en:n1', 'fixture'),
  (83502, 83501, 'Interior trim', 20,
   'JEPC', 'M3187', 'C8450', 'I8', 'en', 'N2', 'N1',
   'Interior trim', 2, 'fixture:835:en:n2', 'fixture'),
  (83503, 83502, 'Carpets', 30,
   'JEPC', 'M3187', 'C8450', 'I8', 'en', 'N3', 'N2',
   'Carpets', 3, 'fixture:835:en:n3', 'fixture'),
  (83504, 83502, 'Carpets alternate occurrence path', 40,
   'JEPC', 'M3187', 'C8450', 'I8', 'en', 'N4', 'N2',
   'Carpets alternate occurrence path', 4, 'fixture:835:en:n4', 'fixture'),

  (83511, NULL, 'XK8 lähdemalli', 10,
   'JEPC', 'M3187', 'C8450', 'I8', 'fi', 'F1', NULL,
   'XK8 lähdemalli', 1, 'fixture:835:fi:f1', 'fixture'),
  (83512, 83511, 'Sisusta', 20,
   'JEPC', 'M3187', 'C8450', 'I8', 'fi', 'F2', 'F1',
   'Sisusta', 2, 'fixture:835:fi:f2', 'fixture'),
  (83513, 83512, 'Lattia', 30,
   'JEPC', 'M3187', 'C8450', 'I8', 'fi', 'F3', 'F2',
   'Lattia', 3, 'fixture:835:fi:f3', 'fixture'),
  (83514, 83513, 'Matot', 40,
   'JEPC', 'M3187', 'C8450', 'I8', 'fi', 'F4', 'F3',
   'Matot', 4, 'fixture:835:fi:f4', 'fixture');

INSERT OR IGNORE INTO part_tree_part (tree_node_id, part_id) VALUES
  (83503, 53801),
  (83504, 53801),
  (83514, 53801);

INSERT INTO part_occurrence_tree_path (
  id, part_occurrence_id, tree_node_id, source_namespace, source_path_id,
  application_id, source_ref, verification_status
) VALUES
  (83521, 53811, 83503, 'JEPC', 'M3187/C8450/I8/en/path-a',
   'APP-53811', 'fixture:835:path:en:a', 'fixture'),
  (83522, 53811, 83504, 'JEPC', 'M3187/C8450/I8/en/path-b',
   'APP-53811', 'fixture:835:path:en:b', 'fixture'),
  (83523, 53811, 83514, 'JEPC', 'M3187/C8450/I8/fi/path-a',
   'APP-53811', 'fixture:835:path:fi:a', 'fixture'),
  (83524, 53812, 83503, 'JEPC', 'M3187/C8450/I8/en/path-a',
   'APP-53812', 'fixture:835:path:en:other-occurrence', 'fixture');
