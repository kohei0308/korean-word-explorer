/*
  # Stripe webhook event deduplication table

  Stores processed Stripe event IDs to prevent duplicate processing
  within Stripe's 5-minute replay window.
  Old entries are cleaned up automatically after 24 hours via a scheduled job
  or can be purged manually.
*/

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id  text        PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed_at
  ON stripe_webhook_events (processed_at);

ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Only the service role can read/write this table
CREATE POLICY "Service role only" ON stripe_webhook_events
  USING (false)
  WITH CHECK (false);
