-- Fix: anonymous INSERTs fail with 42501 (insufficient_privilege)
-- RLS policies exist but table-level GRANTs were never issued.

GRANT INSERT ON public.rounds TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rounds TO authenticated;
