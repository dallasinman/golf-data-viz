-- Allow NULL for fairways_hit and greens_in_regulation
-- to support rounds where these stats were not tracked.
-- Existing CHECK constraints are NULL-safe in PostgreSQL.

ALTER TABLE rounds ALTER COLUMN fairways_hit DROP NOT NULL;
ALTER TABLE rounds ALTER COLUMN greens_in_regulation DROP NOT NULL;
