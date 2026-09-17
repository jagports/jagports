PRAGMA foreign_keys = ON;

-- Additive reference-data representation. No legacy row is promoted to verified
-- applicability and no production JEPC data is seeded by this migration.
CREATE TABLE applicability_bundle (
  id INTEGER PRIMARY KEY,
  source_namespace TEXT NOT NULL CHECK (TRIM(source_namespace) <> ''),
  bundle_key TEXT NOT NULL CHECK (TRIM(bundle_key) <> ''),
  UNIQUE (source_namespace, bundle_key)
);

CREATE TABLE applicability_snapshot (
  id INTEGER PRIMARY KEY,
  bundle_id INTEGER NOT NULL REFERENCES applicability_bundle(id),
  revision INTEGER NOT NULL CHECK (typeof(revision) = 'integer' AND revision > 0),
  parser_version TEXT NOT NULL CHECK (TRIM(parser_version) <> ''),
  mapping_version TEXT NOT NULL CHECK (TRIM(mapping_version) <> ''),
  coverage TEXT NOT NULL DEFAULT 'incomplete' CHECK (coverage IN ('complete', 'incomplete')),
  state TEXT NOT NULL DEFAULT 'staged' CHECK (state IN ('staged', 'active', 'superseded')),
  UNIQUE (bundle_id, revision)
);
CREATE UNIQUE INDEX idx_applicability_snapshot_active
  ON applicability_snapshot(bundle_id) WHERE state = 'active';

CREATE TABLE applicability_evidence (
  id INTEGER PRIMARY KEY,
  snapshot_id INTEGER NOT NULL REFERENCES applicability_snapshot(id),
  relative_path TEXT NOT NULL CHECK (TRIM(relative_path) <> ''),
  file_sha256 TEXT NOT NULL CHECK (length(file_sha256) = 64 AND file_sha256 NOT GLOB '*[^0-9a-f]*'),
  record_locator TEXT NOT NULL CHECK (TRIM(record_locator) <> ''),
  raw_record TEXT NOT NULL,
  UNIQUE (snapshot_id, relative_path, file_sha256, record_locator)
);

-- A serial domain is explicit. Values remain source text until a separately
-- validated comparator interprets them. Unknown != unbounded.
CREATE TABLE applicability_serial_range (
  id INTEGER PRIMARY KEY,
  serial_domain TEXT NOT NULL CHECK (TRIM(serial_domain) <> ''),
  comparator TEXT NOT NULL CHECK (TRIM(comparator) <> ''),
  lower_state TEXT NOT NULL DEFAULT 'unknown' CHECK (lower_state IN ('known', 'unbounded', 'unknown')),
  lower_value TEXT,
  lower_inclusive INTEGER CHECK (lower_inclusive IN (0, 1)),
  upper_state TEXT NOT NULL DEFAULT 'unknown' CHECK (upper_state IN ('known', 'unbounded', 'unknown')),
  upper_value TEXT,
  upper_inclusive INTEGER CHECK (upper_inclusive IN (0, 1)),
  verification TEXT NOT NULL DEFAULT 'unverified' CHECK (verification IN ('verified', 'unverified', 'conflict')),
  vin_range_id INTEGER REFERENCES vin_range(id),
  CHECK ((lower_state = 'known' AND lower_value IS NOT NULL AND TRIM(lower_value) <> '' AND lower_inclusive IS NOT NULL)
    OR (lower_state <> 'known' AND lower_value IS NULL AND lower_inclusive IS NULL)),
  CHECK ((upper_state = 'known' AND upper_value IS NOT NULL AND TRIM(upper_value) <> '' AND upper_inclusive IS NOT NULL)
    OR (upper_state <> 'known' AND upper_value IS NULL AND upper_inclusive IS NULL))
);
CREATE INDEX idx_applicability_serial_domain ON applicability_serial_range(serial_domain, comparator);

CREATE TABLE applicability_model_context (
  id INTEGER PRIMARY KEY,
  source_namespace TEXT NOT NULL CHECK (TRIM(source_namespace) <> ''),
  source_model_id TEXT NOT NULL CHECK (TRIM(source_model_id) <> ''),
  context_version TEXT NOT NULL CHECK (TRIM(context_version) <> ''),
  source_parent_id TEXT,
  region_ref TEXT,
  model_range_id INTEGER REFERENCES model_range(id),
  serial_range_id INTEGER REFERENCES applicability_serial_range(id),
  verification TEXT NOT NULL DEFAULT 'unverified' CHECK (verification IN ('verified', 'unverified', 'conflict')),
  UNIQUE (source_namespace, source_model_id, context_version)
);
CREATE INDEX idx_applicability_context_range ON applicability_model_context(model_range_id);

CREATE TABLE applicability_context_evidence (
  context_id INTEGER NOT NULL REFERENCES applicability_model_context(id),
  evidence_id INTEGER NOT NULL REFERENCES applicability_evidence(id),
  PRIMARY KEY (context_id, evidence_id)
);

-- source_key is the logical assertion identity within a bundle. Different
-- snapshot rows retain history; the PART is obtained only through occurrence.
CREATE TABLE occurrence_applicability (
  id INTEGER PRIMARY KEY,
  snapshot_id INTEGER NOT NULL REFERENCES applicability_snapshot(id),
  source_key TEXT NOT NULL CHECK (TRIM(source_key) <> ''),
  part_occurrence_id INTEGER NOT NULL REFERENCES part_occurrence(id),
  model_context_id INTEGER NOT NULL REFERENCES applicability_model_context(id),
  effect TEXT NOT NULL DEFAULT 'include' CHECK (effect IN ('include', 'exclude')),
  verification TEXT NOT NULL DEFAULT 'unverified' CHECK (verification IN ('verified', 'unverified', 'conflict')),
  coverage TEXT NOT NULL DEFAULT 'incomplete' CHECK (coverage IN ('complete', 'incomplete')),
  UNIQUE (snapshot_id, source_key)
);
CREATE INDEX idx_occurrence_applicability_occurrence ON occurrence_applicability(part_occurrence_id);
CREATE INDEX idx_occurrence_applicability_context ON occurrence_applicability(model_context_id);

CREATE TABLE applicability_condition_set (
  id INTEGER PRIMARY KEY,
  assertion_id INTEGER NOT NULL REFERENCES occurrence_applicability(id),
  set_key TEXT NOT NULL CHECK (TRIM(set_key) <> ''),
  coverage TEXT NOT NULL DEFAULT 'incomplete' CHECK (coverage IN ('complete', 'incomplete')),
  unconditional INTEGER NOT NULL DEFAULT 0 CHECK (unconditional IN (0, 1)),
  serial_range_id INTEGER REFERENCES applicability_serial_range(id),
  effective_serial_range_id INTEGER REFERENCES applicability_serial_range(id),
  UNIQUE (assertion_id, set_key),
  CHECK (unconditional = 0 OR (coverage = 'complete' AND serial_range_id IS NULL))
);

-- This is a controlled scalar dimension vocabulary, not arbitrary source EAV.
-- Unsupported/multi-valued source semantics remain evidence until mapped.
CREATE TABLE applicability_dimension (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE CHECK (TRIM(code) <> ''),
  verification TEXT NOT NULL DEFAULT 'unverified' CHECK (verification IN ('verified', 'unverified', 'conflict'))
);
CREATE TABLE applicability_dimension_value (
  dimension_id INTEGER NOT NULL REFERENCES applicability_dimension(id),
  value_code TEXT NOT NULL CHECK (TRIM(value_code) <> ''),
  PRIMARY KEY (dimension_id, value_code)
);
CREATE TABLE applicability_attribute_condition (
  id INTEGER PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES applicability_condition_set(id),
  dimension_id INTEGER NOT NULL,
  operator TEXT NOT NULL CHECK (operator IN ('equals', 'not_equals')),
  value_code TEXT NOT NULL,
  FOREIGN KEY (dimension_id, value_code) REFERENCES applicability_dimension_value(dimension_id, value_code),
  UNIQUE (set_id, dimension_id, operator, value_code)
);
CREATE INDEX idx_applicability_attribute_lookup ON applicability_attribute_condition(dimension_id, value_code);

-- Evidence can be shared by alternatives; separate paths can support one set.
CREATE TABLE applicability_set_evidence (
  set_id INTEGER NOT NULL REFERENCES applicability_condition_set(id),
  evidence_id INTEGER NOT NULL REFERENCES applicability_evidence(id),
  PRIMARY KEY (set_id, evidence_id)
);

CREATE TRIGGER applicability_no_unconditional_attribute_insert
BEFORE INSERT ON applicability_attribute_condition
WHEN EXISTS (SELECT 1 FROM applicability_condition_set WHERE id = NEW.set_id AND unconditional = 1)
BEGIN SELECT RAISE(ABORT, 'unconditional set cannot contain attributes'); END;
CREATE TRIGGER applicability_no_unconditional_attribute_update
BEFORE UPDATE OF set_id ON applicability_attribute_condition
WHEN EXISTS (SELECT 1 FROM applicability_condition_set WHERE id = NEW.set_id AND unconditional = 1)
BEGIN SELECT RAISE(ABORT, 'unconditional set cannot contain attributes'); END;
CREATE TRIGGER applicability_no_unconditional_set_update
BEFORE UPDATE OF unconditional ON applicability_condition_set
WHEN NEW.unconditional = 1 AND EXISTS (SELECT 1 FROM applicability_attribute_condition WHERE set_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'conditional set contains attributes'); END;

-- A set-level serial predicate inherits the domain of its model. Unknown model
-- bounds may be NULL, but incompatible established domains cannot be paired.
CREATE TRIGGER applicability_serial_set_insert
BEFORE INSERT ON applicability_condition_set
WHEN EXISTS (
  SELECT 1 FROM occurrence_applicability a
  JOIN applicability_model_context c ON c.id = a.model_context_id
  JOIN applicability_serial_range m ON m.id = c.serial_range_id
  JOIN applicability_serial_range s ON s.id IN (NEW.serial_range_id, NEW.effective_serial_range_id)
  WHERE a.id = NEW.assertion_id AND (m.serial_domain <> s.serial_domain OR m.comparator <> s.comparator)
)
BEGIN SELECT RAISE(ABORT, 'incompatible serial domains'); END;

CREATE TRIGGER applicability_serial_context_update
BEFORE UPDATE OF serial_range_id ON applicability_model_context
WHEN EXISTS (
  SELECT 1 FROM occurrence_applicability a
  JOIN applicability_condition_set g ON g.assertion_id=a.id
  JOIN applicability_serial_range s ON s.id IN (g.serial_range_id,g.effective_serial_range_id)
  JOIN applicability_serial_range m ON m.id=NEW.serial_range_id
  WHERE a.model_context_id=OLD.id AND (m.serial_domain<>s.serial_domain OR m.comparator<>s.comparator)
)
BEGIN SELECT RAISE(ABORT, 'incompatible serial domains'); END;
CREATE TRIGGER applicability_serial_assertion_update
BEFORE UPDATE OF model_context_id ON occurrence_applicability
WHEN EXISTS (
  SELECT 1 FROM applicability_condition_set g
  JOIN applicability_model_context c ON c.id=NEW.model_context_id
  JOIN applicability_serial_range m ON m.id=c.serial_range_id
  JOIN applicability_serial_range s ON s.id IN (g.serial_range_id,g.effective_serial_range_id)
  WHERE g.assertion_id=OLD.id AND (m.serial_domain<>s.serial_domain OR m.comparator<>s.comparator)
)
BEGIN SELECT RAISE(ABORT, 'incompatible serial domains'); END;
CREATE TRIGGER applicability_serial_domain_update
BEFORE UPDATE OF serial_domain, comparator ON applicability_serial_range
WHEN EXISTS (
  SELECT 1 FROM applicability_condition_set g
  JOIN occurrence_applicability a ON a.id=g.assertion_id
  JOIN applicability_model_context c ON c.id=a.model_context_id
  JOIN applicability_serial_range m ON m.id=c.serial_range_id
  JOIN applicability_serial_range s ON s.id IN (g.serial_range_id,g.effective_serial_range_id)
  WHERE (s.id=OLD.id AND m.id<>OLD.id AND (m.serial_domain<>NEW.serial_domain OR m.comparator<>NEW.comparator))
     OR (m.id=OLD.id AND s.id<>OLD.id AND (s.serial_domain<>NEW.serial_domain OR s.comparator<>NEW.comparator))
)
BEGIN SELECT RAISE(ABORT, 'incompatible serial domains'); END;
CREATE TRIGGER applicability_serial_set_update
BEFORE UPDATE OF serial_range_id, effective_serial_range_id, assertion_id ON applicability_condition_set
WHEN EXISTS (
  SELECT 1 FROM occurrence_applicability a
  JOIN applicability_model_context c ON c.id = a.model_context_id
  JOIN applicability_serial_range m ON m.id = c.serial_range_id
  JOIN applicability_serial_range s ON s.id IN (NEW.serial_range_id, NEW.effective_serial_range_id)
  WHERE a.id = NEW.assertion_id AND (m.serial_domain <> s.serial_domain OR m.comparator <> s.comparator)
)
BEGIN SELECT RAISE(ABORT, 'incompatible serial domains'); END;
