import { useState } from 'react';
import { X, Crown, Check, Loader2, Sparkles } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';

type PlanInterval = 'month' | 'year';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<PlanInterval>('year');

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
          interval,
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
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-modal-in">
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

        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setInterval('month')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              interval === 'month'
                ? 'bg-stone-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {t('planMonthly')}
          </button>
          <button
            onClick={() => setInterval('year')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative ${
              interval === 'year'
                ? 'bg-stone-800 text-white shadow-md'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {t('planYearly')}
            <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full leading-none">
              {t('planYearlyDiscount')}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div
            onClick={() => setInterval('month')}
            className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 ${
              interval === 'month'
                ? 'border-stone-800 bg-stone-50 shadow-sm'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <p className="text-xs font-medium text-stone-500 mb-2">{t('planMonthly')}</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-bold text-stone-800">{t('planMonthlyPrice')}</span>
              <span className="text-stone-400 text-xs">{t('planMonthlyUnit')}</span>
            </div>
          </div>

          <div
            onClick={() => setInterval('year')}
            className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 ${
              interval === 'year'
                ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-1 ring-amber-200'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            {interval === 'year' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-rose-400 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5" />
                {t('planRecommended')}
              </div>
            )}
            <p className="text-xs font-medium text-stone-500 mb-2">{t('planYearly')}</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-bold text-stone-800">{t('planYearlyPrice')}</span>
              <span className="text-stone-400 text-xs">{t('planYearlyUnit')}</span>
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-1">{t('planYearlyEquiv')}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 rounded-2xl p-4 mb-6">
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
