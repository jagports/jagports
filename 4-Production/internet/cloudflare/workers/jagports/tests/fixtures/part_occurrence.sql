PRAGMA foreign_keys = ON;

-- Representative PART occurrence fixture for #525.
INSERT INTO part_occurrence (
  part_id,
  source,
  source_ref,
  context_type,
  context_ref,
  category_ref,
  item_number,
  diagram_ref,
  diagram_item_number,
  verification_status
) VALUES
  (1, 'fixture-epc', 'occurrence-001', 'epc', 'x100-body-exterior', 'body/exterior', '12', 'diagram-001', '12', 'fixture'),
  (1, 'fixture-epc', 'occurrence-002', 'epc', 'x150-body-exterior', 'body/exterior', '7', NULL, NULL, 'fixture');
