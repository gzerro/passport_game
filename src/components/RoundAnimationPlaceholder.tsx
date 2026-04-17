import { StageIndicator } from '../types/game';

interface RoundAnimationPlaceholderProps {
  stage: StageIndicator;
  secondsLeft: number;
  totalSeconds: number;
}

export const RoundAnimationPlaceholder = ({
  stage,
  secondsLeft,
  totalSeconds,
}: RoundAnimationPlaceholderProps) => {
  const isResolving = stage === 'resolving';
  const isFinished = stage === 'finished';
  const safeTotal = totalSeconds <= 0 ? 1 : totalSeconds;
  const progress = isResolving ? ((safeTotal - secondsLeft) / safeTotal) * 100 : isFinished ? 100 : 0;
  const width = `${Math.max(0, Math.min(100, progress)).toFixed(1)}%`;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Анимация раунда</p>

      <div className="mt-3 h-14 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div
          className={
            isResolving ? 'animation-lane h-full w-full' : isFinished ? 'h-full w-full bg-emerald-100' : 'h-full w-full bg-slate-100'
          }
        />
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-500 transition-all duration-200" style={{ width }} />
      </div>
    </section>
  );
};
