import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { WordResult } from '../types/word';

export interface SavedWord {
  id: string;
  word: string;
  meaning: string;
  result: WordResult;
  created_at: string;
}

export function useSavedWords(userId: string | null) {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSavedWords = useCallback(async () => {
    if (!userId) {
      setSavedWords([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('saved_words')
      .select('id, word, meaning, result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) {
      setSavedWords(data as SavedWord[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  const saveWord = useCallback(async (word: string, meaning: string, result: WordResult) => {
    if (!userId) return false;
    const { error } = await supabase.from('saved_words').upsert(
      { user_id: userId, word, meaning, result },
      { onConflict: 'user_id,word' }
    );
    if (!error) {
      await loadSavedWords();
      return true;
    }
    return false;
  }, [userId, loadSavedWords]);

  const removeWord = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('saved_words').delete().eq('id', id).eq('user_id', userId);
    setSavedWords((prev) => prev.filter((w) => w.id !== id));
  }, [userId]);

  const isWordSaved = useCallback((word: string) => {
    return savedWords.some((w) => w.word === word);
  }, [savedWords]);

  return { savedWords, loading, saveWord, removeWord, isWordSaved };
}
