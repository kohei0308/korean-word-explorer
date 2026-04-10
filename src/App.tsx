import { useState, useEffect } from 'react';
import { User, LogOut, Crown } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useWordLookup } from './hooks/useWordLookup';
import SearchBar from './components/SearchBar';
import ResultTabs from './components/ResultTabs';
import UsageBadge from './components/UsageBadge';
import UpgradeModal from './components/UpgradeModal';
import AuthModal from './components/AuthModal';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const { result, loading, error, isPremium, usage, lookup } = useWordLookup();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50/30 to-teal-50/40 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-300 to-amber-300 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">韓</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-800 leading-tight">ハングル辞書</h1>
              <p className="text-[10px] text-stone-400">Korean Word Explorer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                {!isPremium && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-rose-100 text-amber-700 rounded-lg text-xs font-medium hover:from-amber-200 hover:to-rose-200 transition-all border border-amber-200/60"
                  >
                    <Crown className="w-3 h-3" />
                    PRO
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                  title="ログアウト"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-stone-600 hover:text-stone-800 hover:bg-white/60 rounded-lg text-sm transition-all"
              >
                <User className="w-4 h-4" />
                ログイン
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-16">
        <div className="max-w-xl mx-auto">
          {!result && !loading && !error && (
            <div className="text-center pt-16 pb-10">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-200/60 to-amber-200/60 rounded-3xl flex items-center justify-center">
                <span className="text-4xl">한</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-800 mb-2">韓国語を調べよう</h2>
              <p className="text-stone-500 text-sm max-w-xs mx-auto leading-relaxed">
                単語を入力すると、意味・活用・文法・フレーズ・ネイティブの声をまとめて表示します
              </p>
            </div>
          )}

          <SearchBar onSearch={lookup} loading={loading} />

          <div className="flex justify-center mt-4">
            <UsageBadge count={usage.count} limit={usage.limit} isPremium={isPremium} />
          </div>

          {loading && (
            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-3 bg-white/80 px-6 py-4 rounded-2xl shadow-sm border border-stone-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-stone-500">AIが単語を分析中...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-8 max-w-md mx-auto bg-rose-50/80 border border-rose-200 rounded-2xl p-5 text-center">
              <p className="text-rose-600 text-sm">{error}</p>
              {error.includes('有料プラン') && (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="mt-3 px-5 py-2 bg-gradient-to-r from-amber-400 to-rose-400 text-white text-sm font-medium rounded-xl hover:from-amber-500 hover:to-rose-500 transition-all"
                >
                  プレミアムにアップグレード
                </button>
              )}
            </div>
          )}

          {result && !loading && (
            <ResultTabs
              result={result}
              isPremium={isPremium}
              onUpgradeClick={() => setShowUpgrade(true)}
            />
          )}
        </div>
      </main>

      <footer className="relative z-10 text-center py-6 text-xs text-stone-400">
        <p>Powered by AI -- Korean Word Explorer</p>
      </footer>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}
