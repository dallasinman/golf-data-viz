-- Harden launch write path:
-- direct public API table mutations are disabled.
-- Writes must go through server-side admin path.

REVOKE INSERT, UPDATE, DELETE ON public.rounds FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.rounds FROM authenticated;
GRANT SELECT ON public.rounds TO authenticated;
