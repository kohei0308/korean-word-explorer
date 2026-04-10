import { BookOpen, Volume2, GraduationCap, Tag } from 'lucide-react';
import type { BasicInfo } from '../../types/word';

interface BasicTabProps {
  data: BasicInfo;
}

export default function BasicTab({ data }: BasicTabProps) {
  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h2 className="text-4xl font-bold text-stone-800 mb-2">{data.word}</h2>
        <p className="text-lg text-rose-500 font-medium">{data.meaning}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          icon={<Volume2 className="w-4 h-4 text-teal-500" />}
          label="発音"
          value={data.pronunciation}
          sub={data.romanization}
        />
        <InfoCard
          icon={<Tag className="w-4 h-4 text-amber-500" />}
          label="品詞"
          value={data.partOfSpeech}
        />
        <InfoCard
          icon={<GraduationCap className="w-4 h-4 text-rose-400" />}
          label="レベル"
          value={`TOPIK ${data.level}`}
        />
        <InfoCard
          icon={<BookOpen className="w-4 h-4 text-sky-500" />}
          label="単語"
          value={data.word}
        />
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/70 rounded-xl p-4 border border-stone-100">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs text-stone-400 font-medium">{label}</span>
      </div>
      <p className="text-stone-800 font-semibold">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}
