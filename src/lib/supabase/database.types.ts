/**
 * Supabase Database type definitions.
 *
 * TEMPORARY: Hand-written to match supabase/migrations/00000000000000_initial_schema.sql.
 * Replace with generated output once local Supabase or staging is available:
 *   - Local:  npm run db:types
 *   - Remote: npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      rounds: {
        Row: {
          id: string;
          user_id: string | null;
          created_at: string;
          played_at: string;
          course_name: string;
          score: number;
          handicap_index: number;
          course_rating: number;
          slope_rating: number;
          fairways_hit: number;
          fairway_attempts: number;
          greens_in_regulation: number;
          total_putts: number;
          penalty_strokes: number;
          eagles: number;
          birdies: number;
          pars: number;
          bogeys: number;
          double_bogeys: number;
          triple_plus: number;
          up_and_down_attempts: number | null;
          up_and_down_converted: number | null;
          sand_saves: number | null;
          sand_save_attempts: number | null;
          three_putts: number | null;
          sg_total: number | null;
          sg_off_the_tee: number | null;
          sg_approach: number | null;
          sg_around_the_green: number | null;
          sg_putting: number | null;
          benchmark_bracket: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          created_at?: string;
          played_at: string;
          course_name: string;
          score: number;
          handicap_index: number;
          course_rating: number;
          slope_rating: number;
          fairways_hit: number;
          fairway_attempts: number;
          greens_in_regulation: number;
          total_putts: number;
          penalty_strokes: number;
          eagles: number;
          birdies: number;
          pars: number;
          bogeys: number;
          double_bogeys: number;
          triple_plus: number;
          up_and_down_attempts?: number | null;
          up_and_down_converted?: number | null;
          sand_saves?: number | null;
          sand_save_attempts?: number | null;
          three_putts?: number | null;
          sg_total?: number | null;
          sg_off_the_tee?: number | null;
          sg_approach?: number | null;
          sg_around_the_green?: number | null;
          sg_putting?: number | null;
          benchmark_bracket?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rounds"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
