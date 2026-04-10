import { X, Crown, Check } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const benefits = [
  '無制限の単語検索',
  'ネイティブの声（文化・ニュアンス解説）',
  '関連語・類義語・対義語',
];

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-modal-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">プレミアムプラン</h2>
          <p className="text-stone-500 text-sm mt-1">すべての学習機能をアンロック</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-5 mb-6">
          <div className="flex items-baseline justify-center gap-1 mb-4">
            <span className="text-3xl font-bold text-stone-800">¥500</span>
            <span className="text-stone-500 text-sm">/月</span>
          </div>
          <ul className="space-y-2.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-stone-700">
                <Check className="w-4 h-4 text-teal-500 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <button className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-rose-400 hover:from-amber-500 hover:to-rose-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-amber-200/50 hover:shadow-amber-300/50">
          プレミアムに登録する
        </button>
        <p className="text-center text-xs text-stone-400 mt-3">
          いつでもキャンセル可能 ・ Stripe決済
        </p>
      </div>
    </div>
  );
}
