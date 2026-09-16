PRAGMA foreign_keys = ON;

-- #674: availability and A-E stock-quality classification are independent.
-- Keep normalized physical-location integrity for available stock, but allow
-- condition_code to remain NULL until the stock quality has been classified.

DROP TRIGGER IF EXISTS stock_item_available_integrity_insert;
DROP TRIGGER IF EXISTS stock_item_available_integrity_update;

CREATE TRIGGER stock_item_available_integrity_insert
BEFORE INSERT ON stock_item
WHEN NEW.available = 1
 AND NEW.storage_location_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'available stock requires storage location');
END;

CREATE TRIGGER stock_item_available_integrity_update
BEFORE UPDATE OF available, storage_location_id ON stock_item
WHEN NEW.available = 1
 AND NEW.storage_location_id IS NULL
BEGIN
  SELECT RAISE(ABORT, 'available stock requires storage location');
END;
