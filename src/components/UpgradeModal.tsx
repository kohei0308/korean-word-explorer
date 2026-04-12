import { useState } from 'react';
import { X, Crown, Check, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const benefits = [t('upgradeBenefit1'), t('upgradeBenefit2'), t('upgradeBenefit3')];

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError(t('upgradeLoginRequired'));
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          successUrl: window.location.origin,
          cancelUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error || t('upgradeError'));
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError(t('upgradeError'));
      setLoading(false);
    }
  };

  if (!open) return null;

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

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">{t('upgradeTitle')}</h2>
          <p className="text-stone-500 text-sm mt-1">{t('upgradeSubtitle')}</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-5 mb-6">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-3xl font-bold text-stone-800">¥500</span>
            <span className="text-stone-500 text-sm">/月</span>
          </div>
          <ul className="space-y-2.5">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-stone-700">
                <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-200/50 hover:shadow-amber-300/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t('upgradeLoading') : t('upgradeButton')}
        </button>
        <p className="text-center text-xs text-stone-400 mt-3">
          {t('upgradeCancel')}
        </p>
      </div>
    </div>
  );
}
