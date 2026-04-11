import { ArrowLeft, Trash2, BookOpen } from 'lucide-react';
import type { SavedWord } from '../hooks/useSavedWords';

interface WordBookPageProps {
  savedWords: SavedWord[];
  loading: boolean;
  onBack: () => void;
  onRemove: (id: string) => void;
  onSelect: (word: string) => void;
}

export default function WordBookPage({
  savedWords,
  loading,
  onBack,
  onRemove,
  onSelect,
}: WordBookPageProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-white/60 rounded-xl transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-stone-800">マイ単語帳</h2>
        </div>
        <span className="ml-auto text-xs text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
          {savedWords.length}語
        </span>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="flex gap-1 justify-center">
            <span className="w-2 h-2 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : savedWords.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-stone-300" />
          </div>
          <p className="text-stone-400 text-sm">保存した単語はまだありません</p>
          <p className="text-stone-400 text-xs mt-1">検索結果画面で「単語帳に保存」をタップ</p>
        </div>
      ) : (
        <div className="space-y-2">
          {savedWords.map((item) => (
            <div
              key={item.id}
              className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-stone-100 hover:border-stone-200 transition-all group"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelect(item.word)}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-stone-800">{item.word}</span>
                    <span className="text-sm text-stone-500 truncate">{item.meaning}</span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {new Date(item.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </button>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-2 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
