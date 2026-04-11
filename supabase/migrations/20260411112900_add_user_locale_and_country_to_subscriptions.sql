/*
  # Add user locale and country tracking to subscriptions

  1. Modified Tables
    - `subscriptions`
      - Add `user_locale` (text) - stores user's language preference ('ja' or 'ko')
      - Add `user_country` (text) - stores user's country code ('JP', 'KR', etc.)

  2. Notes
    - These columns enable segmented analytics for conversion rates by locale/country
    - Supports future country-specific pricing (e.g., KRW for Korean users)
    - Default to empty string so existing rows are not affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'user_locale'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN user_locale text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'user_country'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN user_country text NOT NULL DEFAULT '';
  END IF;
END $$;
