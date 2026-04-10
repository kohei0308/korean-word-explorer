import { useState, useCallback } from 'react';
import type { WordResult, LookupResponse } from '../types/word';
import { supabase } from '../lib/supabase';

interface UsageInfo {
  count: number;
  limit: number;
}

export function useWordLookup() {
  const [result, setResult] = useState<WordResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [usage, setUsage] = useState<UsageInfo>({ count: 0, limit: 3 });

  const lookup = useCallback(async (word: string) => {
    if (!word.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${session?.access_token || anonKey}`,
      };

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lookup-word`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ word: word.trim(), clientIp: 'browser' }),
      });

      const json: LookupResponse = await response.json();

      if (json.usage) {
        setUsage({ count: json.usage.count, limit: json.usage.limit });
      }

      if (!response.ok || json.error) {
        if ((json as Record<string, unknown>).debug) {
          console.error('[lookup-word] Debug info:', (json as Record<string, unknown>).debug);
        }
        setError(json.error || '検索中にエラーが発生しました');
        return;
      }

      if (json.data) {
        setResult(json.data);
        setIsPremium(json.isPremium || false);
      }
    } catch {
      setError('ネットワークエラーが発生しました。接続を確認してください。');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, isPremium, usage, lookup, reset };
}
