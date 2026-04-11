/*
  # Add language column to word_cache for bilingual caching

  1. Modified Tables
    - `word_cache`
      - Add `lang` (text) column with default 'ja' for existing rows
      - Drop old unique constraint on `word` alone
      - Add new composite unique constraint on `(word, lang)`

  2. Notes
    - Existing cached entries are tagged as 'ja' (Japanese mode, the original default)
    - New entries will be either 'ja' (Japanese->Korean) or 'ko' (Korean->Japanese)
    - The unique index on `word` is replaced with a composite unique on `(word, lang)`
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'word_cache' AND column_name = 'lang'
  ) THEN
    ALTER TABLE word_cache ADD COLUMN lang text NOT NULL DEFAULT 'ja';
  END IF;
END $$;

ALTER TABLE word_cache DROP CONSTRAINT IF EXISTS word_cache_word_key;
DROP INDEX IF EXISTS idx_word_cache_word;

CREATE UNIQUE INDEX IF NOT EXISTS idx_word_cache_word_lang ON word_cache (word, lang);
