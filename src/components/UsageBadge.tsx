interface UsageBadgeProps {
  count: number;
  limit: number;
  isPremium: boolean;
}

export default function UsageBadge({ count, limit, isPremium }: UsageBadgeProps) {
  if (isPremium) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700">
        <span className="w-2 h-2 bg-amber-400 rounded-full" />
        プレミアム会員
      </div>
    );
  }

  const remaining = Math.max(0, limit - count);
  const isLow = remaining <= 1;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
      isLow
        ? 'bg-rose-50 border-rose-200 text-rose-600'
        : 'bg-stone-50 border-stone-200 text-stone-600'
    }`}>
      <span className={`w-2 h-2 rounded-full ${isLow ? 'bg-rose-400' : 'bg-teal-400'}`} />
      本日の残り検索回数: {remaining}/{limit}
    </div>
  );
}
