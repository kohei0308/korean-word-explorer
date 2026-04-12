/*
  # Add plan_interval column to subscriptions

  1. Modified Tables
    - `subscriptions`
      - `plan_interval` (text) - 'month' or 'year', defaults to 'month'

  2. Notes
    - Needed to distinguish between monthly (980 JPY/month) and yearly (7800 JPY/year) plans
    - Existing rows default to 'month'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'plan_interval'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN plan_interval text NOT NULL DEFAULT 'month';
  END IF;
END $$;
