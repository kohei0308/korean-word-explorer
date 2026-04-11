/*
  # Fix RLS performance and add missing index

  1. Index Changes
    - Add index on `subscriptions.user_id` for foreign key performance
    - Drop unused indexes `idx_saved_words_user_word` and `idx_search_history_user_date`

  2. RLS Policy Updates (auth.uid() -> (select auth.uid()) for performance)
    - `user_profiles`: read, insert, update policies
    - `saved_words`: view, insert, delete policies
    - `search_history`: view, insert, delete policies

  3. Notes
    - Wrapping auth.uid() in a select subquery prevents re-evaluation per row
    - The subscriptions foreign key index improves join/lookup performance
    - Unused indexes are dropped to reduce write overhead
*/

-- 1. Add missing index on subscriptions.user_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);

-- 2. Drop unused indexes
DROP INDEX IF EXISTS idx_saved_words_user_word;
DROP INDEX IF EXISTS idx_search_history_user_date;

-- 3. Fix user_profiles RLS policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- 4. Fix saved_words RLS policies
DROP POLICY IF EXISTS "Users can view own saved words" ON saved_words;
CREATE POLICY "Users can view own saved words"
  ON saved_words FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own saved words" ON saved_words;
CREATE POLICY "Users can insert own saved words"
  ON saved_words FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own saved words" ON saved_words;
CREATE POLICY "Users can delete own saved words"
  ON saved_words FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 5. Fix search_history RLS policies
DROP POLICY IF EXISTS "Users can view own search history" ON search_history;
CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own search history" ON search_history;
CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON search_history;
CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);
