-- #895: Fit terminology transition for active read contracts.
-- Historical applicability_* relations are immutable migration history and remain
-- the persistence implementation during the compatibility window. These views
-- expose the approved Fit vocabulary without copying, rewriting or weakening
-- source provenance, retirement, revision or audit rules.
CREATE VIEW fit_dimension AS
SELECT * FROM applicability_dimension;
CREATE VIEW fit_dimension_value AS
SELECT * FROM applicability_dimension_value;
CREATE VIEW fit_source_description AS
SELECT * FROM applicability_source_description;
CREATE VIEW fit_mapping_revision AS
SELECT * FROM applicability_description_mapping_revision;
CREATE VIEW fit_mapping_current AS
SELECT * FROM applicability_description_mapping_current;
CREATE VIEW fit_dimension_label AS
SELECT * FROM applicability_dimension_label;
CREATE VIEW fit_dimension_value_label AS
SELECT * FROM applicability_dimension_value_label;
CREATE VIEW fit_dimension_retirement AS
SELECT * FROM applicability_dimension_retirement;
CREATE VIEW fit_dimension_value_retirement AS
SELECT * FROM applicability_dimension_value_retirement;
CREATE VIEW fit_admin_audit AS
SELECT * FROM applicability_suitability_admin_audit;