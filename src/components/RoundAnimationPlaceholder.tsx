interface RoundAnimationPlaceholderProps {
  isActive: boolean;
  secondsLeft: number;
  totalSeconds: number;
}

export const RoundAnimationPlaceholder = ({
  isActive,
  secondsLeft,
  totalSeconds,
}: RoundAnimationPlaceholderProps) => {
  const safeTotal = totalSeconds <= 0 ? 1 : totalSeconds;
  const progress = isActive ? ((safeTotal - secondsLeft) / safeTotal) * 100 : 0;
  const width = `${Math.max(0, Math.min(100, progress)).toFixed(1)}%`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Анимация раунда</p>
        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold',
            isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
          ].join(' ')}
        >
          {isActive ? 'Идет игра' : 'Ожидание'}
        </span>
      </div>

      <div className="mt-3 h-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className={isActive ? 'animation-lane h-full w-full' : 'h-full w-full bg-slate-100'} />
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-500 transition-all duration-200" style={{ width }} />
      </div>
    </section>
  );
};
