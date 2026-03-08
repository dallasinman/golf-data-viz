-- Summary columns on rounds (denormalized for query efficiency)
ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS has_trouble_context boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trouble_hole_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trouble_tee_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trouble_approach_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trouble_around_green_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trouble_putting_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trouble_penalty_count smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS attribution_version text;

-- Trouble holes detail table
CREATE TABLE IF NOT EXISTS public.round_trouble_holes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  round_id uuid NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  hole_number smallint,
  primary_cause text NOT NULL,
  CONSTRAINT chk_hole_number CHECK (hole_number IS NULL OR hole_number BETWEEN 1 AND 18),
  CONSTRAINT chk_primary_cause CHECK (
    primary_cause IN ('tee', 'approach', 'around_green', 'putting', 'penalty')
  )
);

CREATE INDEX IF NOT EXISTS idx_trouble_holes_round_id ON public.round_trouble_holes(round_id);

-- RLS: writes go through service role only (bypasses RLS)
ALTER TABLE public.round_trouble_holes ENABLE ROW LEVEL SECURITY;

-- Read policy: users can see trouble holes for their own rounds (or anonymous rounds)
CREATE POLICY "Users can read trouble holes for own rounds"
  ON public.round_trouble_holes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.rounds r
    WHERE r.id = round_trouble_holes.round_id
    AND (r.user_id IS NULL OR auth.uid() = r.user_id)
  ));
