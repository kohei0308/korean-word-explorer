import { Sparkles } from 'lucide-react';
import type { GrammarPattern } from '../../types/word';
import CopyButton from '../CopyButton';
import SpeakButton from '../SpeakButton';
import { useLang } from '../../i18n/LanguageContext';

interface GrammarTabProps {
  data: GrammarPattern[];
  onCopied?: () => void;
}

export default function GrammarTab({ data, onCopied }: GrammarTabProps) {
  const { t } = useLang();
  const speechLang = 'ko-KR';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-stone-500">{t('grammarTitle')}</h3>
      {data.map((item, i) => (
        <div key={i} className="bg-white/70 rounded-xl p-4 border border-stone-100 space-y-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-stone-800 text-base">{item.pattern}</p>
              <p className="text-sm text-stone-500 mt-0.5">{item.explanation}</p>
            </div>
          </div>
          <div className="bg-stone-50/80 rounded-lg p-3 ml-6">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-stone-800 text-sm font-medium">{item.example}</p>
                <p className="text-stone-500 text-xs mt-1">{item.translation}</p>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <SpeakButton text={item.example} speechLang={speechLang} />
                <CopyButton text={item.example} onCopied={onCopied} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
