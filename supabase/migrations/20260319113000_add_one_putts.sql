ALTER TABLE public.rounds
  ADD COLUMN IF NOT EXISTS one_putts smallint;

ALTER TABLE public.rounds
  DROP CONSTRAINT IF EXISTS chk_one_putts;

ALTER TABLE public.rounds
  ADD CONSTRAINT chk_one_putts CHECK (
    one_putts IS NULL
    OR (one_putts >= 0 AND one_putts <= total_putts)
  );

ALTER TABLE public.rounds
  DROP CONSTRAINT IF EXISTS chk_short_game_putt_sum;

ALTER TABLE public.rounds
  ADD CONSTRAINT chk_short_game_putt_sum CHECK (
    COALESCE(one_putts, 0) + COALESCE(three_putts, 0) <= 18
  );

GRANT SELECT (one_putts) ON public.rounds TO anon;
