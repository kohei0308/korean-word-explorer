/*
  # Remove overly permissive anonymous RLS policies on daily_usage

  1. Changes
    - Drop "Anon users can read own usage by IP" (SELECT) — allows any anon to read ALL anon rows
    - Drop "Anon users can insert own usage" (INSERT)
    - Drop "Anon users can update own usage" (UPDATE)

  2. Rationale
    - daily_usage for anonymous users is only accessed via Edge Functions using service_role key
    - service_role bypasses RLS, so these policies are unnecessary
    - The SELECT policy had no IP filtering, exposing all anonymous usage data
*/

DROP POLICY IF EXISTS "Anon users can read own usage by IP" ON daily_usage;
DROP POLICY IF EXISTS "Anon users can insert own usage" ON daily_usage;
DROP POLICY IF EXISTS "Anon users can update own usage" ON daily_usage;
