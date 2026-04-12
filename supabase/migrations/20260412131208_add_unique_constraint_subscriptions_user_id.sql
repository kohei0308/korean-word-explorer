/*
  # Add unique constraint on subscriptions.user_id

  1. Changes
    - Drop existing non-unique index on subscriptions(user_id)
    - Add unique index on subscriptions(user_id) to support upsert operations from Stripe webhook

  2. Notes
    - Each user should have at most one subscription record
    - Required for the Stripe webhook to upsert subscription data by user_id
*/

DROP INDEX IF EXISTS idx_subscriptions_user_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
