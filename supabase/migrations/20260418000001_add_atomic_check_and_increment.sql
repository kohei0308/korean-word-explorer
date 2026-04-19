/*
  # Atomic check-and-increment for daily usage limits

  Replaces the separate getUsageCount + incrementUsage pattern that had a
  TOCTOU race condition. These functions atomically check the limit and
  increment in a single locked transaction.

  Returns: new count (≥1) on success, -1 if already at or over limit.
*/

CREATE OR REPLACE FUNCTION check_and_increment_usage_auth(
  p_user_id uuid,
  p_search_date date,
  p_limit int
) RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO daily_usage (user_id, user_ip, search_date, search_count)
  VALUES (p_user_id, '', p_search_date, 0)
  ON CONFLICT (user_id, search_date) WHERE user_id IS NOT NULL DO NOTHING;

  SELECT search_count INTO v_count
  FROM daily_usage
  WHERE user_id = p_user_id AND search_date = p_search_date
  FOR UPDATE;

  IF v_count >= p_limit THEN
    RETURN -1;
  END IF;

  UPDATE daily_usage
  SET search_count = search_count + 1
  WHERE user_id = p_user_id AND search_date = p_search_date;

  RETURN v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION check_and_increment_usage_anon(
  p_user_ip text,
  p_search_date date,
  p_limit int
) RETURNS int AS $$
DECLARE
  v_count int;
BEGIN
  INSERT INTO daily_usage (user_ip, user_id, search_date, search_count)
  VALUES (p_user_ip, NULL, p_search_date, 0)
  ON CONFLICT (user_ip, search_date) WHERE user_id IS NULL DO NOTHING;

  SELECT search_count INTO v_count
  FROM daily_usage
  WHERE user_ip = p_user_ip AND user_id IS NULL AND search_date = p_search_date
  FOR UPDATE;

  IF v_count >= p_limit THEN
    RETURN -1;
  END IF;

  UPDATE daily_usage
  SET search_count = search_count + 1
  WHERE user_ip = p_user_ip AND user_id IS NULL AND search_date = p_search_date;

  RETURN v_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
