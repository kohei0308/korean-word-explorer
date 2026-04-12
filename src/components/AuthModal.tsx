import { useState, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../i18n/LanguageContext';
import type { TranslationKey } from '../i18n/translations';

const authErrorMap: [RegExp, TranslationKey][] = [
  [/Invalid login credentials/i, 'authErrorInvalidCredentials'],
  [/Email not confirmed/i, 'authErrorEmailNotConfirmed'],
  [/User already registered/i, 'authErrorUserExists'],
  [/Password should be at least 6 characters/i, 'authErrorPasswordTooShort'],
  [/Unable to validate email address: invalid format/i, 'authErrorInvalidEmail'],
];

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLang();

  const translateAuthError = (err: unknown): string => {
    const raw = err instanceof Error ? err.message : '';
    for (const [pattern, key] of authErrorMap) {
      if (pattern.test(raw)) return t(key);
    }
    return t('authError');
  };

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        onClose();
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onClose();
      }
    } catch (err: unknown) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(translateAuthError(err));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-stone-800 text-center mb-6">
          {mode === 'login' ? t('authLoginTitle') : t('authSignupTitle')}
        </h2>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-3 mb-5 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {t('authGoogleButton')}
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-xs text-stone-400">{t('authDivider')}</span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">{t('authEmail')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">{t('authPassword')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 rounded-lg p-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-rose-400 hover:bg-rose-500 disabled:bg-stone-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? t('authLoginButton') : t('authSignupButton')}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 mt-4">
          {mode === 'login' ? (
            <>{t('authNoAccount')} <button onClick={() => { setMode('signup'); setError(null); }} className="text-rose-500 font-medium hover:underline">{t('authSignupLink')}</button></>
          ) : (
            <>{t('authHasAccount')} <button onClick={() => { setMode('login'); setError(null); }} className="text-rose-500 font-medium hover:underline">{t('authLoginLink')}</button></>
          )}
        </p>
      </div>
    </div>
  );
}
