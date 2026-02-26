-- Golf Data Viz: Initial Schema
-- Applied via `supabase db reset` or `supabase db push`
-- Spec: docs/supabase-schema.md

-- =============================================================================
-- ROUNDS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS rounds (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at            timestamptz NOT NULL DEFAULT now(),

  -- Round metadata
  played_at             date        NOT NULL,
  course_name           text        NOT NULL,
  score                 smallint    NOT NULL,
  handicap_index        numeric(3,1) NOT NULL,
  course_rating         numeric(3,1) NOT NULL,
  slope_rating          smallint    NOT NULL,

  -- Aggregate stats
  fairways_hit          smallint    NOT NULL,
  fairway_attempts      smallint    NOT NULL,
  greens_in_regulation  smallint    NOT NULL,
  total_putts           smallint    NOT NULL,
  penalty_strokes       smallint    NOT NULL,

  -- Scoring distribution
  eagles                smallint    NOT NULL,
  birdies               smallint    NOT NULL,
  pars                  smallint    NOT NULL,
  bogeys                smallint    NOT NULL,
  double_bogeys         smallint    NOT NULL,
  triple_plus           smallint    NOT NULL,

  -- Optional detailed stats
  up_and_down_attempts  smallint,
  up_and_down_converted smallint,
  sand_saves            smallint,
  sand_save_attempts    smallint,
  three_putts           smallint,

  -- Calculated strokes gained (populated after calculation)
  sg_total              numeric(4,2),
  sg_off_the_tee        numeric(4,2),
  sg_approach           numeric(4,2),
  sg_around_the_green   numeric(4,2),
  sg_putting            numeric(4,2),
  benchmark_bracket     text,

  -- Range constraints
  CONSTRAINT chk_score_range     CHECK (score BETWEEN 50 AND 150),
  CONSTRAINT chk_handicap_range  CHECK (handicap_index BETWEEN 0 AND 54),
  CONSTRAINT chk_course_rating   CHECK (course_rating BETWEEN 60 AND 80),
  CONSTRAINT chk_slope_rating    CHECK (slope_rating BETWEEN 55 AND 155),
  CONSTRAINT chk_scoring_sum     CHECK (eagles + birdies + pars + bogeys + double_bogeys + triple_plus = 18),

  -- Relational constraints
  CONSTRAINT chk_fairways        CHECK (fairways_hit <= fairway_attempts),

  -- Paired nullability: both NULL or both NOT NULL
  CONSTRAINT chk_up_and_down_paired CHECK (
    (up_and_down_attempts IS NULL) = (up_and_down_converted IS NULL)
  ),
  CONSTRAINT chk_sand_saves_paired CHECK (
    (sand_save_attempts IS NULL) = (sand_saves IS NULL)
  ),

  -- Optional stat comparison + bounds
  CONSTRAINT chk_up_and_down CHECK (
    up_and_down_converted IS NULL
    OR (up_and_down_converted >= 0 AND up_and_down_converted <= up_and_down_attempts)
  ),
  CONSTRAINT chk_sand_saves CHECK (
    sand_saves IS NULL
    OR (sand_saves >= 0 AND sand_saves <= sand_save_attempts)
  ),

  -- three_putts bounded by total_putts
  CONSTRAINT chk_three_putts CHECK (
    three_putts IS NULL
    OR (three_putts >= 0 AND three_putts <= total_putts)
  ),

  -- Non-negative bounds for required count fields
  CONSTRAINT chk_fairways_hit_nonneg         CHECK (fairways_hit >= 0),
  CONSTRAINT chk_fairway_attempts_nonneg     CHECK (fairway_attempts >= 0),
  CONSTRAINT chk_greens_in_regulation_nonneg CHECK (greens_in_regulation >= 0),
  CONSTRAINT chk_total_putts_nonneg          CHECK (total_putts >= 0),
  CONSTRAINT chk_penalty_strokes_nonneg      CHECK (penalty_strokes >= 0),
  CONSTRAINT chk_eagles_nonneg               CHECK (eagles >= 0),
  CONSTRAINT chk_birdies_nonneg              CHECK (birdies >= 0),
  CONSTRAINT chk_pars_nonneg                 CHECK (pars >= 0),
  CONSTRAINT chk_bogeys_nonneg               CHECK (bogeys >= 0),
  CONSTRAINT chk_double_bogeys_nonneg        CHECK (double_bogeys >= 0),
  CONSTRAINT chk_triple_plus_nonneg          CHECK (triple_plus >= 0)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_rounds_user_id    ON rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_rounds_played_at  ON rounds(played_at);
CREATE INDEX IF NOT EXISTS idx_rounds_handicap   ON rounds(handicap_index);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- Anyone can insert, but only with their own user_id or NULL (anonymous)
CREATE POLICY "Anyone can insert rounds"
  ON rounds FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Authenticated users can read their own rounds
CREATE POLICY "Users can read own rounds"
  ON rounds FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can update their own rounds
CREATE POLICY "Users can update own rounds"
  ON rounds FOR UPDATE
  USING (auth.uid() = user_id);

-- Authenticated users can delete their own rounds
CREATE POLICY "Users can delete own rounds"
  ON rounds FOR DELETE
  USING (auth.uid() = user_id);
