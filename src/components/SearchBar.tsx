import { useState, type FormEvent } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';

interface SearchBarProps {
  onSearch: (word: string) => void;
  loading: boolean;
}

export default function SearchBar({ onSearch, loading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const { t } = useLang();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-200 via-amber-100 to-teal-200 rounded-2xl blur-md opacity-60 group-focus-within:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-stone-200/60 overflow-hidden transition-shadow duration-300 group-focus-within:shadow-lg">
          <Search className="ml-5 w-5 h-5 text-stone-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="min-w-0 flex-1 px-3 sm:px-4 py-4 text-base bg-transparent text-stone-800 placeholder-stone-400 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="mr-2 min-w-[60px] flex-shrink-0 px-4 sm:px-5 py-2.5 bg-rose-400 hover:bg-rose-500 disabled:bg-stone-300 text-white rounded-xl font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              t('searchButton')
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
