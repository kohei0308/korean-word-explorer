import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { WordResult } from '../types/word';
import { useLang } from '../i18n/LanguageContext';

interface SaveWordButtonProps {
  word: string;
  result: WordResult;
  isSaved: boolean;
  isLoggedIn: boolean;
  onSave: (word: string, meaning: string, result: WordResult) => Promise<boolean>;
  onLoginRequired: () => void;
  onSaved: () => void;
}

export default function SaveWordButton({
  word,
  result,
  isSaved,
  isLoggedIn,
  onSave,
  onLoginRequired,
  onSaved,
}: SaveWordButtonProps) {
  const { t } = useLang();
  const [saving, setSaving] = useState(false);

  const handleClick = async () => {
    if (!isLoggedIn) {
      onLoginRequired();
      return;
    }
    if (isSaved || saving) return;

    setSaving(true);
    const success = await onSave(word, result.basic.meaning, result);
    if (success) {
      onSaved();
    }
    setSaving(false);
  };

  if (isSaved) {
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 text-teal-600 border border-teal-200 rounded-xl text-sm font-medium cursor-default"
      >
        <BookmarkCheck className="w-4 h-4" />
        {t('saved')}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-600 border border-stone-200 hover:border-rose-200 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {t('saveToWordbook')}
    </button>
  );
}
