import { Clock, X } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

interface HistoryEntry {
  word: string;
  searched_at: string;
}

interface SearchHistoryProps {
  history: HistoryEntry[];
  onSelect: (word: string) => void;
  onClear: () => void;
}

export default function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  const { t } = useLang();

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-3">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-stone-400">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{t('searchHistory')}</span>
        </div>
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-3 h-3" />
          {t('clearHistory')}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {history.map((entry, i) => (
          <button
            key={`${entry.word}-${i}`}
            onClick={() => onSelect(entry.word)}
            className="px-3 py-1.5 bg-white/70 hover:bg-white border border-stone-200/60 hover:border-stone-300 rounded-lg text-sm text-stone-700 hover:text-stone-900 transition-all duration-150"
          >
            {entry.word}
          </button>
        ))}
      </div>
    </div>
  );
}
