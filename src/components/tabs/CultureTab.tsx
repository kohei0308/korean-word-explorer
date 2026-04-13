import { Mic, MessageSquare, AlertTriangle, Volume2 } from 'lucide-react';
import type { CultureNote } from '../../types/word';
import { useLang } from '../../i18n/LanguageContext';
import SpeakButton from '../SpeakButton';

interface CultureTabProps {
  data: CultureNote;
}

export default function CultureTab({ data }: CultureTabProps) {
  const { t, lang } = useLang();
  const speechLang = lang === 'ja' ? 'ko-KR' : 'ja-JP';

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-stone-500 mb-3">{t('cultureTitle')}</h3>
        <div className="bg-gradient-to-br from-amber-50/80 to-rose-50/80 rounded-xl p-5 border border-amber-100/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Mic className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-stone-700 leading-relaxed text-sm">{data.note}</p>
          </div>
        </div>
      </div>

      {data.nativeExpressions && data.nativeExpressions.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3 flex items-center gap-1.5">
            <Volume2 className="w-4 h-4" />
            {lang === 'ja' ? 'ネイティブのリアル表現' : '원어민 리얼 표현'}
          </h3>
          <div className="space-y-2.5">
            {data.nativeExpressions.map((expr, i) => (
              <div key={i} className="bg-white/70 rounded-xl p-4 border border-stone-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-bold text-stone-800">{expr.expression}</span>
                  <SpeakButton text={expr.expression} speechLang={speechLang} />
                </div>
                <p className="text-sm text-stone-600 mb-1">{expr.meaning}</p>
                <p className="text-xs text-stone-400">{expr.usage}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.commonMistakes && data.commonMistakes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {lang === 'ja' ? '日本人が間違いやすいポイント' : '한국인이 틀리기 쉬운 포인트'}
          </h3>
          <div className="space-y-2.5">
            {data.commonMistakes.map((item, i) => (
              <div key={i} className="bg-rose-50/50 rounded-xl p-4 border border-rose-100/60">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-rose-100 text-rose-600 font-medium flex-shrink-0">
                    {lang === 'ja' ? 'NG' : 'NG'}
                  </span>
                  <p className="text-sm text-rose-700">{item.mistake}</p>
                </div>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs px-2 py-0.5 rounded-md bg-teal-100 text-teal-600 font-medium flex-shrink-0">
                    OK
                  </span>
                  <p className="text-sm text-teal-700">{item.correction}</p>
                </div>
                <p className="text-xs text-stone-500 pl-1">{item.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.conversations && data.conversations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            {lang === 'ja' ? '実際の会話例' : '실제 회화 예시'}
          </h3>
          <div className="space-y-3">
            {data.conversations.map((conv, i) => (
              <div key={i} className="bg-white/70 rounded-xl p-4 border border-stone-100">
                <p className="text-xs font-medium text-amber-600 mb-3 px-2 py-1 bg-amber-50 rounded-lg inline-block">
                  {conv.situation}
                </p>
                <div className="space-y-2">
                  {conv.lines.map((line, j) => (
                    <div key={j} className={`flex gap-2 ${j % 2 === 0 ? '' : 'pl-4'}`}>
                      <div className={`flex-1 rounded-xl px-3.5 py-2.5 ${
                        j % 2 === 0
                          ? 'bg-stone-100/80 rounded-tl-sm'
                          : 'bg-teal-50/80 rounded-tr-sm'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm text-stone-800 font-medium">{line}</p>
                          <SpeakButton text={line} speechLang={speechLang} />
                        </div>
                        {conv.translation[j] && (
                          <p className="text-xs text-stone-500 mt-1">{conv.translation[j]}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.pronunciationTips && data.pronunciationTips.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-stone-500 mb-3 flex items-center gap-1.5">
            <Mic className="w-4 h-4" />
            {lang === 'ja' ? '発音のコツ' : '발음 팁'}
          </h3>
          <div className="bg-gradient-to-br from-sky-50/80 to-teal-50/80 rounded-xl p-4 border border-sky-100/60 space-y-2.5">
            {data.pronunciationTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 text-xs font-bold text-sky-600 shadow-sm">
                  {i + 1}
                </span>
                <p className="text-sm text-stone-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
