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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        setError('アプリの設定が不正です。管理者にお問い合わせください。');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${session?.access_token || anonKey}`,
      };

      const apiUrl = `${supabaseUrl}/functions/v1/lookup-word`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ word: word.trim(), clientIp: 'browser' }),
      });

      if (!response.ok && response.headers.get('content-type')?.includes('text/html')) {
        setError('サーバーへの接続に失敗しました。しばらくしてからお試しください。');
        return;
      }

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
