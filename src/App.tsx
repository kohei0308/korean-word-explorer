import { useState, useEffect, useCallback } from 'react';
import { User, LogOut, Crown, BookOpen } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useLang } from './i18n/LanguageContext';
import { useWordLookup } from './hooks/useWordLookup';
import { useSearchHistory } from './hooks/useSearchHistory';
import { useSavedWords } from './hooks/useSavedWords';
import { useToast } from './hooks/useToast';
import SearchBar from './components/SearchBar';
import SearchHistory from './components/SearchHistory';
import ResultTabs from './components/ResultTabs';
import SaveWordButton from './components/SaveWordButton';
import UsageBadge from './components/UsageBadge';
import UpgradeModal from './components/UpgradeModal';
import AuthModal from './components/AuthModal';
import WordBookPage from './components/WordBookPage';
import Toast from './components/Toast';
import type { Session } from '@supabase/supabase-js';

type Page = 'home' | 'wordbook';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState<Page>('home');
  const { result, loading, error, isPremium, tier, usage, lookup } = useWordLookup();
  const { toast, showToast, hideToast } = useToast();
  const { lang, setLang, t } = useLang();

  const userId = session?.user?.id ?? null;
  const { history, addEntry, clearHistory } = useSearchHistory(userId);
  const { savedWords, loading: savedLoading, saveWord, removeWord, isWordSaved } = useSavedWords(userId);

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

  const handleSearch = useCallback(async (word: string) => {
    setPage('home');
    await addEntry(word);
    lookup(word, lang);
  }, [addEntry, lookup, lang]);

  const handleHistorySelect = useCallback((word: string) => {
    handleSearch(word);
  }, [handleSearch]);

  const handleWordBookSelect = useCallback((word: string) => {
    setPage('home');
    handleSearch(word);
  }, [handleSearch]);

  const toggleLang = () => {
    setLang(lang === 'ja' ? 'ko' : 'ja');
  };

  const heroChar = lang === 'ja' ? '한' : 'あ';

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50/30 to-teal-50/40 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-10 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setPage('home')}
            className="flex items-center gap-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-300 to-amber-300 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">{lang === 'ja' ? '韓' : '日'}</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-800 leading-tight">{t('appTitle')}</h1>
              <p className="text-[10px] text-stone-400">{t('appSubtitle')}</p>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/70 hover:bg-white border border-stone-200/60 hover:border-stone-300 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-800 transition-all"
              title={lang === 'ja' ? '韓国語モードに切替' : '일본어 모드로 전환'}
            >
              <span className="text-base leading-none">{lang === 'ja' ? '\u{1F1EF}\u{1F1F5}' : '\u{1F1F0}\u{1F1F7}'}</span>
              <span className="hidden sm:inline">{lang === 'ja' ? 'JA' : 'KO'}</span>
            </button>
            {session ? (
              <>
                <button
                  onClick={() => setPage('wordbook')}
                  className="p-2 text-stone-400 hover:text-stone-600 transition-colors relative"
                  title={t('wordbook')}
                >
                  <BookOpen className="w-4 h-4" />
                  {savedWords.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {savedWords.length > 99 ? '99' : savedWords.length}
                    </span>
                  )}
                </button>
                {!isPremium && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-rose-100 text-amber-700 rounded-lg text-xs font-medium hover:from-amber-200 hover:to-rose-200 transition-all border border-amber-200/60"
                  >
                    <Crown className="w-3 h-3" />
                    {t('pro')}
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                  title={t('logout')}
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
                {t('login')}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-16">
        {page === 'wordbook' && session ? (
          <WordBookPage
            savedWords={savedWords}
            loading={savedLoading}
            onBack={() => setPage('home')}
            onRemove={(id) => {
              removeWord(id);
              showToast(t('removedToast'));
            }}
            onSelect={handleWordBookSelect}
          />
        ) : (
          <div className="max-w-xl mx-auto">
            {!result && !loading && !error && (
              <div className="text-center pt-16 pb-10">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-200/60 to-amber-200/60 rounded-3xl flex items-center justify-center">
                  <span className="text-4xl">{heroChar}</span>
                </div>
                <h2 className="text-2xl font-bold text-stone-800 mb-2">{t('heroTitle')}</h2>
                <p className="text-stone-500 text-sm max-w-xs mx-auto leading-relaxed">
                  {t('heroDescription')}
                </p>
              </div>
            )}

            <SearchBar onSearch={handleSearch} loading={loading} />

            {!result && !loading && (
              <SearchHistory
                history={history}
                onSelect={handleHistorySelect}
                onClear={clearHistory}
              />
            )}

            <div className="flex justify-center mt-4">
              <UsageBadge count={usage.count} limit={usage.limit} tier={tier} />
            </div>

            {loading && (
              <div className="text-center mt-12">
                <div className="inline-flex items-center gap-3 bg-white/80 px-6 py-4 rounded-2xl shadow-sm border border-stone-100">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-stone-500">{t('analyzing')}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 max-w-md mx-auto bg-rose-50/80 border border-rose-200 rounded-2xl p-5 text-center">
                <p className="text-rose-600 text-sm">{error}</p>
                {(error.includes('ログインすると') || error.includes('로그인하면')) && (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="mt-3 px-5 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-white text-sm font-medium rounded-xl hover:from-teal-500 hover:to-cyan-500 transition-all"
                  >
                    {t('limitLoginButton')}
                  </button>
                )}
                {(error.includes('有料プランで無制限') || error.includes('유료 플랜으로')) && (
                  <button
                    onClick={() => setShowUpgrade(true)}
                    className="mt-3 px-5 py-2 bg-gradient-to-r from-amber-400 to-rose-400 text-white text-sm font-medium rounded-xl hover:from-amber-500 hover:to-rose-500 transition-all"
                  >
                    {t('upgradeFromError')}
                  </button>
                )}
              </div>
            )}

            {result && !loading && (
              <>
                <div className="flex justify-center mt-5">
                  <SaveWordButton
                    word={result.basic.word}
                    result={result}
                    isSaved={isWordSaved(result.basic.word)}
                    isLoggedIn={!!session}
                    onSave={saveWord}
                    onLoginRequired={() => setShowAuth(true)}
                    onSaved={() => showToast(t('savedToast'))}
                  />
                </div>
                <ResultTabs
                  result={result}
                  isPremium={isPremium}
                  onUpgradeClick={() => setShowUpgrade(true)}
                  onCopied={() => showToast(t('copiedToast'))}
                />
              </>
            )}
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-6 text-xs text-stone-400">
        <p>{t('footer')}</p>
      </footer>

      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      <Toast message={toast.message} visible={toast.visible} onHide={hideToast} />
    </div>
  );
}
