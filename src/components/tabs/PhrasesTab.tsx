import { MessageCircle } from 'lucide-react';
import type { Phrase } from '../../types/word';

interface PhrasesTabProps {
  data: Phrase[];
}

export default function PhrasesTab({ data }: PhrasesTabProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-500">実践フレーズ</h3>
      {data.map((item, i) => (
        <div key={i} className="bg-white/70 rounded-xl p-4 border border-stone-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-teal-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-stone-800">{item.phrase}</p>
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
