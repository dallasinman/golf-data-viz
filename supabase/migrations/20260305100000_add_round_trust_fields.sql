-- Add trust-scoring metadata columns for write-time round quality classification.
-- pending is retained as a safety fallback for non-app direct inserts.

ALTER TABLE public.rounds
  ADD COLUMN trust_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN trust_reasons text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.rounds
  ADD CONSTRAINT chk_trust_status
  CHECK (trust_status IN ('pending', 'trusted', 'quarantined'));

CREATE INDEX IF NOT EXISTS idx_rounds_trust_status_created_at
  ON public.rounds (trust_status, created_at);
