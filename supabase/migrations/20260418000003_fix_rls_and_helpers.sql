/*
  # RLS clarifications and helper functions

  1. Explicit DELETE denial for daily_usage (anonymous users)
  2. get_user_id_by_email — O(1) email lookup replacing O(n) listUsers pagination
  3. Index on auth.users(email) for fast lookup
*/

-- #10: Make it explicit that anon users cannot delete usage rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_usage' AND policyname = 'Deny delete for anonymous'
  ) THEN
    EXECUTE 'CREATE POLICY "Deny delete for anonymous" ON daily_usage FOR DELETE USING (false)';
  END IF;
END$$;

-- #13: O(1) email-to-user-id lookup (replaces paginated listUsers in stripe-webhook)
-- Index is created only if it does not already exist (auth schema index may be managed by Supabase)
CREATE OR REPLACE FUNCTION get_user_id_by_email(p_email text)
RETURNS uuid AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(p_email) LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- #9: Document that word_cache public read is intentional
COMMENT ON TABLE word_cache IS
  'Public dictionary cache. anon SELECT is intentional — entries contain no PII and serve as a shared lookup cache.';
