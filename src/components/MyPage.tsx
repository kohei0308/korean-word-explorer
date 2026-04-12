import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Crown, Clock, Search, ArrowRightLeft, XCircle, Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLang } from '../i18n/LanguageContext';
import ConfirmModal from './ConfirmModal';

interface Subscription {
  status: string;
  plan_interval: string;
  current_period_end: string | null;
  stripe_subscription_id: string;
}

interface HistoryEntry {
  word: string;
  searched_at: string;
}

interface MyPageProps {
  userId: string;
  onBack: () => void;
  onSearch: (word: string) => void;
  onUpgrade: () => void;
  onToast: (message: string) => void;
}

export default function MyPage({ userId, onBack, onSearch, onUpgrade, onToast }: MyPageProps) {
  const { t } = useLang();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [cancelModal, setCancelModal] = useState(false);
  const [changeModal, setChangeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isPremium = sub?.status === 'active' || sub?.status === 'trialing';

  const fetchSubscription = useCallback(async () => {
    setLoadingSub(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('status, plan_interval, current_period_end, stripe_subscription_id')
      .eq('user_id', userId)
      .maybeSingle();
    setSub(data);
    setLoadingSub(false);
  }, [userId]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('search_history')
      .select('word, searched_at')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(20);
    setHistory(data ?? []);
    setLoadingHistory(false);
  }, [userId]);

  useEffect(() => {
    fetchSubscription();
    fetchHistory();
  }, [fetchSubscription, fetchHistory]);

  const callManageApi = async (action: string, extra?: Record<string, string>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: 'Not authenticated' };

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/manage-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ action, ...extra }),
    });

    return response.json();
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const result = await callManageApi('cancel');
      if (result.success) {
        onToast(t('mypageCancelSuccess'));
        setCancelModal(false);
        await fetchSubscription();
      } else {
        onToast(t('mypageCancelError'));
      }
    } catch {
      onToast(t('mypageCancelError'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeInterval = async () => {
    const newInterval = sub?.plan_interval === 'month' ? 'year' : 'month';
    setActionLoading(true);
    try {
      const result = await callManageApi('change_interval', { interval: newInterval });
      if (result.success) {
        onToast(t('mypageChangeSuccess'));
        setChangeModal(false);
        await fetchSubscription();
      } else {
        onToast(t('mypageChangeError'));
      }
    } catch {
      onToast(t('mypageChangeError'));
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const planName = !isPremium
    ? t('mypagePlanFree')
    : sub?.plan_interval === 'year'
      ? t('mypagePlanYearly')
      : t('mypagePlanMonthly');

  const planPrice = isPremium
    ? sub?.plan_interval === 'year'
      ? t('mypagePlanYearlyPrice')
      : t('mypagePlanMonthlyPrice')
    : null;

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-sm font-medium">{t('mypageTitle')}</span>
      </button>

      <h2 className="text-xl font-bold text-stone-800 mb-6">{t('mypageTitle')}</h2>

      <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPremium ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-stone-100'}`}>
            <Crown className={`w-4 h-4 ${isPremium ? 'text-amber-600' : 'text-stone-400'}`} />
          </div>
          <h3 className="font-semibold text-stone-800">{t('mypagePlanTitle')}</h3>
        </div>

        {loadingSub ? (
          <div className="flex gap-1 justify-center py-4">
            <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <div>
            <div className="flex items-baseline gap-3 mb-1">
              <span className={`text-lg font-bold ${isPremium ? 'text-amber-700' : 'text-stone-700'}`}>
                {planName}
              </span>
              {planPrice && (
                <span className="text-sm text-stone-500">{planPrice}</span>
              )}
            </div>

            {isPremium && sub?.current_period_end && (
              <p className="text-sm text-stone-500 mt-2">
                <span className="font-medium">{t('mypageNextBilling')}:</span>{' '}
                {formatDate(sub.current_period_end)}
                {planPrice && <span className="ml-1.5 text-stone-400">({planPrice})</span>}
              </p>
            )}

            {!isPremium && (
              <button
                onClick={onUpgrade}
                className="mt-4 w-full py-3 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-200/50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t('mypageUpgrade')}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 mb-4 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
            <Clock className="w-4 h-4 text-teal-500" />
          </div>
          <h3 className="font-semibold text-stone-800">{t('mypageSearchHistory')}</h3>
        </div>

        {loadingHistory ? (
          <div className="flex gap-1 justify-center py-4">
            <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">{t('mypageSearchHistoryEmpty')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {history.map((entry, i) => (
              <button
                key={`${entry.word}-${i}`}
                onClick={() => onSearch(entry.word)}
                className="group flex items-center gap-1.5 px-3 py-2 bg-stone-50/80 hover:bg-teal-50 border border-stone-200/60 hover:border-teal-200 rounded-xl text-sm text-stone-700 hover:text-teal-700 transition-all duration-150"
              >
                <Search className="w-3 h-3 text-stone-400 group-hover:text-teal-400 transition-colors" />
                {entry.word}
              </button>
            ))}
          </div>
        )}
      </section>

      {isPremium && (
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 mb-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-stone-500" />
            </div>
            <h3 className="font-semibold text-stone-800">{t('mypagePlanManage')}</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setChangeModal(true)}
              className="w-full py-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {sub?.plan_interval === 'month' ? t('mypageChangeToYearly') : t('mypageChangeToMonthly')}
            </button>

            <button
              onClick={() => setCancelModal(true)}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <XCircle className="w-4 h-4" />
              {t('mypageCancelPlan')}
            </button>
          </div>
        </section>
      )}

      <div className="mt-6 mb-4 flex justify-center">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 px-5 py-2.5 text-stone-500 hover:text-stone-700 hover:bg-white/60 rounded-xl text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>

      <ConfirmModal
        open={cancelModal}
        title={t('mypageCancelConfirmTitle')}
        message={t('mypageCancelConfirmMessage')}
        confirmLabel={t('mypageCancelConfirmButton')}
        cancelLabel={t('mypageCancelConfirmCancel')}
        loading={actionLoading}
        destructive
        onConfirm={handleCancel}
        onClose={() => setCancelModal(false)}
      />

      <ConfirmModal
        open={changeModal}
        title={t('mypageChangeConfirmTitle')}
        message={sub?.plan_interval === 'month' ? t('mypageChangeToYearlyMessage') : t('mypageChangeToMonthlyMessage')}
        confirmLabel={t('mypageChangeConfirmButton')}
        cancelLabel={t('mypageChangeConfirmCancel')}
        loading={actionLoading}
        onConfirm={handleChangeInterval}
        onClose={() => setChangeModal(false)}
      />
    </div>
  );
}
