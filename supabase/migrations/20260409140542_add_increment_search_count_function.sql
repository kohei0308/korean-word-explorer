/*
  # Add helper function for incrementing search count

  1. Functions
    - `increment_search_count(target_word text)` - atomically increments the search_count column for a cached word
*/

CREATE OR REPLACE FUNCTION increment_search_count(target_word text)
RETURNS void AS $$
BEGIN
  UPDATE word_cache
  SET search_count = search_count + 1,
      updated_at = now()
  WHERE word = target_word;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
