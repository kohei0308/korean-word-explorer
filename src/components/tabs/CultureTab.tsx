import { Mic } from 'lucide-react';
import type { CultureNote } from '../../types/word';

interface CultureTabProps {
  data: CultureNote;
}

export default function CultureTab({ data }: CultureTabProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-500 mb-3">ネイティブの声</h3>
      <div className="bg-gradient-to-br from-amber-50/80 to-rose-50/80 rounded-xl p-5 border border-amber-100/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Mic className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-stone-700 leading-relaxed text-sm">{data.note}</p>
        </div>
      </div>
    </div>
  );
}
