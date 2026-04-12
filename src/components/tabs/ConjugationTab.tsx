import type { Conjugation } from '../../types/word';
import type { TranslationKey } from '../../i18n/translations';
import { useLang } from '../../i18n/LanguageContext';

interface ConjugationTabProps {
  data: Conjugation;
}

const rows: { key: keyof Conjugation; labelKey: TranslationKey; categoryKey: TranslationKey }[] = [
  { key: 'haeyoForm', labelKey: 'conjugationHaeyo', categoryKey: 'conjugationPolite' },
  { key: 'habnidaForm', labelKey: 'conjugationHabnida', categoryKey: 'conjugationFormal' },
  { key: 'panmalForm', labelKey: 'conjugationPanmal', categoryKey: 'conjugationCasual' },
  { key: 'negativeHaeyo', labelKey: 'conjugationNegHaeyo', categoryKey: 'conjugationNegative' },
  { key: 'negativeHabnida', labelKey: 'conjugationNegHabnida', categoryKey: 'conjugationNegative' },
  { key: 'pastHaeyo', labelKey: 'conjugationPastHaeyo', categoryKey: 'conjugationPast' },
  { key: 'pastHabnida', labelKey: 'conjugationPastHabnida', categoryKey: 'conjugationPast' },
];

const categoryColors: Record<string, string> = {
  conjugationPolite: 'bg-teal-50 text-teal-600 border-teal-200',
  conjugationFormal: 'bg-sky-50 text-sky-600 border-sky-200',
  conjugationCasual: 'bg-amber-50 text-amber-600 border-amber-200',
  conjugationNegative: 'bg-rose-50 text-rose-500 border-rose-200',
  conjugationPast: 'bg-stone-50 text-stone-500 border-stone-200',
};

export default function ConjugationTab({ data }: ConjugationTabProps) {
  const { t } = useLang();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-500 mb-3">{t('conjugationTitle')}</h3>
      {rows.map(({ key, labelKey, categoryKey }) => (
        <div key={key} className="flex items-center gap-3 bg-white/70 rounded-xl p-3.5 border border-stone-100">
          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap ${categoryColors[categoryKey]}`}>
            {t(labelKey)}
          </span>
          <span className="text-stone-800 font-medium text-base flex-1 text-right">
            {data[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
