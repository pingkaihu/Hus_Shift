ALTER TABLE da_holidays
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'government'
  CHECK (source IN ('government', 'weekend', 'manual'));
