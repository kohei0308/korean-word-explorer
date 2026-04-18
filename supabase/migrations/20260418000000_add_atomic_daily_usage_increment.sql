/*
  # Add atomic daily usage increment functions

  Replace the non-atomic read-modify-write pattern in Edge Functions
  with atomic upsert functions to prevent race conditions where
  concurrent requests could read the same count and under-count usage.
*/

CREATE OR REPLACE FUNCTION increment_daily_usage_auth(
  p_user_id uuid,
  p_search_date date
) RETURNS void AS $$
BEGIN
  INSERT INTO daily_usage (user_id, user_ip, search_date, search_count)
  VALUES (p_user_id, '', p_search_date, 1)
  ON CONFLICT (user_id, search_date) WHERE user_id IS NOT NULL
    DO UPDATE SET search_count = daily_usage.search_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION increment_daily_usage_anon(
  p_user_ip text,
  p_search_date date
) RETURNS void AS $$
BEGIN
  INSERT INTO daily_usage (user_ip, user_id, search_date, search_count)
  VALUES (p_user_ip, NULL, p_search_date, 1)
  ON CONFLICT (user_ip, search_date) WHERE user_id IS NULL
    DO UPDATE SET search_count = daily_usage.search_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
