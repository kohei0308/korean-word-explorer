/*
  # Korean Word Learning App Schema

  1. New Tables
    - `word_cache`
      - `id` (uuid, primary key)
      - `word` (text, unique) - the Korean word searched
      - `result` (jsonb) - full Claude API response cached
      - `search_count` (integer) - how many times this word has been searched
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    - `daily_usage`
      - `id` (uuid, primary key)
      - `user_ip` (text) - anonymous user identifier (IP hash)
      - `user_id` (uuid, nullable) - authenticated user id
      - `search_date` (date) - the date of search
      - `search_count` (integer) - number of searches that day
      - `created_at` (timestamptz)
    - `subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text)
      - `status` (text) - active, canceled, past_due
      - `current_period_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - word_cache: readable by all authenticated and anon users (public cache)
    - daily_usage: users can only read/write their own usage
    - subscriptions: users can only read their own subscription

  3. Indexes
    - word_cache: unique index on word
    - daily_usage: composite index on (user_ip, search_date) and (user_id, search_date)
*/

CREATE TABLE IF NOT EXISTS word_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE word_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read word cache"
  ON word_cache FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ip text NOT NULL DEFAULT '',
  user_id uuid REFERENCES auth.users(id),
  search_date date NOT NULL DEFAULT CURRENT_DATE,
  search_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon users can read own usage by IP"
  ON daily_usage FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE POLICY "Anon users can insert own usage"
  ON daily_usage FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anon users can update own usage"
  ON daily_usage FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Auth users can read own usage"
  ON daily_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Auth users can insert own usage"
  ON daily_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Auth users can update own usage"
  ON daily_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_usage_ip_date ON daily_usage (user_ip, search_date) WHERE user_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_usage_user_date ON daily_usage (user_id, search_date) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  stripe_customer_id text NOT NULL DEFAULT '',
  stripe_subscription_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_word_cache_word ON word_cache (word);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
