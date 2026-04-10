import type { Conjugation } from '../../types/word';

interface ConjugationTabProps {
  data: Conjugation;
}

const rows: { key: keyof Conjugation; label: string; category: string }[] = [
  { key: 'haeyoForm', label: '해요体', category: '丁寧' },
  { key: 'habnidaForm', label: '합니다体', category: 'フォーマル' },
  { key: 'panmalForm', label: 'パンマル', category: 'カジュアル' },
  { key: 'negativeHaeyo', label: '否定（해요）', category: '否定' },
  { key: 'negativeHabnida', label: '否定（합니다）', category: '否定' },
  { key: 'pastHaeyo', label: '過去（해요）', category: '過去' },
  { key: 'pastHabnida', label: '過去（합니다）', category: '過去' },
];

const categoryColors: Record<string, string> = {
  '丁寧': 'bg-teal-50 text-teal-600 border-teal-200',
  'フォーマル': 'bg-sky-50 text-sky-600 border-sky-200',
  'カジュアル': 'bg-amber-50 text-amber-600 border-amber-200',
  '否定': 'bg-rose-50 text-rose-500 border-rose-200',
  '過去': 'bg-stone-50 text-stone-500 border-stone-200',
};

export default function ConjugationTab({ data }: ConjugationTabProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-500 mb-3">活用一覧</h3>
      {rows.map(({ key, label, category }) => (
        <div key={key} className="flex items-center gap-3 bg-white/70 rounded-xl p-3.5 border border-stone-100">
          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap ${categoryColors[category]}`}>
            {label}
          </span>
          <span className="text-stone-800 font-medium text-base flex-1 text-right">
            {data[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
