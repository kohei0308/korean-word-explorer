import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'hangul-search-history';
const LOCAL_MAX = 10;

interface HistoryEntry {
  word: string;
  searched_at: string;
}

export function useSearchHistory(userId: string | null) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    if (userId) {
      const { data } = await supabase
        .from('search_history')
        .select('word, searched_at')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(LOCAL_MAX);
      if (data) {
        setHistory(data);
      }
    } else {
      try {
        const raw = sessionStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          setHistory(JSON.parse(raw));
        }
      } catch {
        setHistory([]);
      }
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const addEntry = useCallback(async (word: string) => {
    const entry: HistoryEntry = { word, searched_at: new Date().toISOString() };

    if (userId) {
      // Remove existing entry for same word, then re-insert to move it to top
      await supabase.from('search_history').delete().eq('user_id', userId).eq('word', word);
      await supabase.from('search_history').insert({ user_id: userId, word });
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.word !== word);
        return [entry, ...filtered].slice(0, LOCAL_MAX);
      });
    } else {
      setHistory((prev) => {
        const filtered = prev.filter((h) => h.word !== word);
        const next = [entry, ...filtered].slice(0, LOCAL_MAX);
        try {
          sessionStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // storage full
        }
        return next;
      });
    }
  }, [userId]);

  const clearHistory = useCallback(async () => {
    if (userId) {
      await supabase.from('search_history').delete().eq('user_id', userId);
    } else {
      sessionStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    setHistory([]);
  }, [userId]);

  return { history, addEntry, clearHistory };
}
