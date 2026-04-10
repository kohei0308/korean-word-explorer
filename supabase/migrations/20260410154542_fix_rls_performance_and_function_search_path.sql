/*
  # Fix RLS performance and function security

  1. RLS Policy Fixes (daily_usage)
    - Replace `auth.uid()` with `(select auth.uid())` in all three authenticated policies:
      - "Auth users can read own usage" (SELECT)
      - "Auth users can insert own usage" (INSERT)
      - "Auth users can update own usage" (UPDATE)
    - This prevents re-evaluation of auth.uid() per row, improving query performance

  2. RLS Policy Fixes (subscriptions)
    - Replace `auth.uid()` with `(select auth.uid())` in:
      - "Users can read own subscription" (SELECT)

  3. Index Cleanup
    - Drop unused index `idx_subscriptions_user` on subscriptions table
    - The primary key and RLS policies handle lookups; this index adds write overhead with no read benefit

  4. Function Security
    - Recreate `increment_search_count` with an immutable `search_path` set to `public`
    - Prevents search_path manipulation attacks on SECURITY DEFINER functions
*/

-- 1. Fix daily_usage RLS policies

DROP POLICY IF EXISTS "Auth users can read own usage" ON daily_usage;
CREATE POLICY "Auth users can read own usage"
  ON daily_usage FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Auth users can insert own usage" ON daily_usage;
CREATE POLICY "Auth users can insert own usage"
  ON daily_usage FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Auth users can update own usage" ON daily_usage;
CREATE POLICY "Auth users can update own usage"
  ON daily_usage FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 2. Fix subscriptions RLS policy

DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 3. Drop unused index

DROP INDEX IF EXISTS idx_subscriptions_user;

-- 4. Fix function search_path

CREATE OR REPLACE FUNCTION increment_search_count(target_word text)
RETURNS void AS $$
BEGIN
  UPDATE word_cache
  SET search_count = search_count + 1,
      updated_at = now()
  WHERE word = target_word;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
