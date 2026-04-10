import { ArrowRight } from 'lucide-react';
import type { RelatedWord } from '../../types/word';

interface RelatedTabProps {
  data: RelatedWord[];
}

const relationColors: Record<string, string> = {
  '類義語': 'bg-teal-50 text-teal-600',
  '対義語': 'bg-rose-50 text-rose-500',
  '関連語': 'bg-amber-50 text-amber-600',
};

export default function RelatedTab({ data }: RelatedTabProps) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-semibold text-stone-500 mb-3">関連語</h3>
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3 bg-white/70 rounded-xl p-3.5 border border-stone-100 group">
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${relationColors[item.relation] || 'bg-stone-50 text-stone-500'}`}>
            {item.relation}
          </span>
          <span className="font-bold text-stone-800">{item.word}</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
          <span className="text-sm text-stone-500 flex-1">{item.meaning}</span>
        </div>
      ))}
    </div>
  );
}
