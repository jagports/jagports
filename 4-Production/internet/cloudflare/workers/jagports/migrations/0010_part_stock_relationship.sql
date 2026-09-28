PRAGMA foreign_keys = ON;

-- Connect operational stock to canonical PART identity without fabricating
-- a PART for unresolved or non-catalogue stock. The legacy part_number
-- column is retained as the stocked/historical part-number reference.
ALTER TABLE stock_item ADD COLUMN part_id INTEGER REFERENCES part(id) ON DELETE SET NULL;
ALTER TABLE stock_item ADD COLUMN donor_vehicle_id INTEGER REFERENCES vehicle(id) ON DELETE SET NULL;
ALTER TABLE stock_item ADD COLUMN source TEXT;
ALTER TABLE stock_item ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE stock_item ADD COLUMN confidence REAL;
ALTER TABLE stock_item ADD COLUMN available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1));

CREATE INDEX idx_stock_item_part_id ON stock_item(part_id);
CREATE INDEX idx_stock_item_available ON stock_item(available);
CREATE INDEX idx_stock_item_donor_vehicle ON stock_item(donor_vehicle_id);
CREATE INDEX idx_stock_item_source ON stock_item(source);
