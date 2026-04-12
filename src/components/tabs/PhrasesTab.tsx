import { MessageCircle } from 'lucide-react';
import type { Phrase } from '../../types/word';
import CopyButton from '../CopyButton';
import SpeakButton from '../SpeakButton';
import { useLang } from '../../i18n/LanguageContext';

interface PhrasesTabProps {
  data: Phrase[];
  onCopied?: () => void;
}

export default function PhrasesTab({ data, onCopied }: PhrasesTabProps) {
  const { t, lang } = useLang();
  const speechLang = lang === 'ko' ? 'ja-JP' : 'ko-KR';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-500">{t('phrasesTitle')}</h3>
      {data.map((item, i) => (
        <div key={i} className="bg-white/70 rounded-xl p-4 border border-stone-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-stone-800">{item.phrase}</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <SpeakButton text={item.phrase} speechLang={speechLang} />
                  <CopyButton text={item.phrase} onCopied={onCopied} />
                </div>
              </div>
              {item.phraseReading && (
                <p className="text-xs text-stone-400 mt-0.5">{item.phraseReading}</p>
              )}
              {item.phraseRomanization && (
                <p className="text-xs text-stone-400 italic mt-0.5">{item.phraseRomanization}</p>
              )}
              <p className="text-sm text-stone-600 mt-0.5">{item.translation}</p>
              <p className="text-xs text-rose-400 mt-2 bg-rose-50 inline-block px-2 py-0.5 rounded-md">
                {item.scene}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
