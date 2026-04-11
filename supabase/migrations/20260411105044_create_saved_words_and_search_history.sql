/*
  # Create saved_words and search_history tables

  1. New Tables
    - `saved_words`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `word` (text, the Korean word)
      - `meaning` (text, Japanese meaning)
      - `result` (jsonb, full word result data)
      - `created_at` (timestamptz)
    - `search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `word` (text, the searched word)
      - `searched_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only read, insert, and delete their own saved words
    - Users can only read and insert their own search history

  3. Indexes
    - Index on saved_words(user_id, word) for fast lookups
    - Index on search_history(user_id, searched_at) for recent history queries
    - Unique constraint on saved_words(user_id, word) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS saved_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  meaning text NOT NULL DEFAULT '',
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, word)
);

ALTER TABLE saved_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved words"
  ON saved_words FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved words"
  ON saved_words FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved words"
  ON saved_words FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_words_user_word
  ON saved_words(user_id, word);

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user_date
  ON search_history(user_id, searched_at DESC);
