/*
  # Create user_profiles table for locale and country tracking

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `user_locale` (text) - 'ja' or 'ko'
      - `user_country` (text) - ISO country code ('JP', 'KR', etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `user_profiles`
    - Authenticated users can read and update their own profile
    - Authenticated users can insert their own profile

  3. Notes
    - Tracks locale/country per user regardless of subscription status
    - Updated on each login with latest browser locale and geo data
    - Enables conversion analytics segmented by locale and country
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  user_locale text NOT NULL DEFAULT '',
  user_country text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
