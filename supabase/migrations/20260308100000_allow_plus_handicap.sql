-- GOL-11A: Allow plus handicap input (-9.9 to 54)
-- and persist benchmark interpolation mode for trust transparency.

ALTER TABLE rounds DROP CONSTRAINT chk_handicap_range;
ALTER TABLE rounds ADD CONSTRAINT chk_handicap_range CHECK (handicap_index BETWEEN -9.9 AND 54);

ALTER TABLE rounds ADD COLUMN IF NOT EXISTS benchmark_interpolation_mode text;
ALTER TABLE rounds ADD CONSTRAINT chk_benchmark_interpolation_mode
  CHECK (benchmark_interpolation_mode IN ('standard', 'scratch_clamped', 'elite_interpolated', 'elite_clamped'));
