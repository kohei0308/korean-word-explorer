import { BookOpen, Volume2, GraduationCap, Tag } from 'lucide-react';
import type { BasicInfo } from '../../types/word';
import { useLang } from '../../i18n/LanguageContext';
import SpeakButton from '../SpeakButton';

interface BasicTabProps {
  data: BasicInfo;
}

export default function BasicTab({ data }: BasicTabProps) {
  const { t } = useLang();
  const speechLang = 'ko-KR';

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-2">
          <h2 className="text-4xl font-bold text-stone-800">{data.word}</h2>
          <SpeakButton text={data.word} speechLang={speechLang} size="md" />
        </div>
        <p className="text-lg text-rose-500 font-medium mt-1">{data.meaning}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/70 rounded-xl p-4 border border-stone-100">
          <div className="flex items-center gap-2 mb-1.5">
            <Volume2 className="w-4 h-4 text-teal-500" />
            <span className="text-xs text-stone-400 font-medium">{t('basicPronunciation')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-stone-800 font-semibold">{data.pronunciation}</p>
            <SpeakButton text={data.word} speechLang={speechLang} />
          </div>
          <p className="text-xs text-stone-400 mt-0.5">{data.romanization}</p>
        </div>
        <InfoCard
          icon={<Tag className="w-4 h-4 text-amber-500" />}
          label={t('basicPartOfSpeech')}
          value={data.partOfSpeech}
        />
        <InfoCard
          icon={<GraduationCap className="w-4 h-4 text-rose-400" />}
          label={t('basicLevel')}
          value={data.level}
        />
        <InfoCard
          icon={<BookOpen className="w-4 h-4 text-sky-500" />}
          label={t('basicWord')}
          value={data.word}
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/70 rounded-xl p-4 border border-stone-100">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs text-stone-400 font-medium">{label}</span>
      </div>
      <p className="text-stone-800 font-semibold">{value}</p>
    </div>
  );
}
