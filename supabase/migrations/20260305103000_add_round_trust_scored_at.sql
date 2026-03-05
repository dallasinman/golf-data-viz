-- Track when trust scoring was evaluated.
ALTER TABLE public.rounds
  ADD COLUMN trust_scored_at timestamptz;
