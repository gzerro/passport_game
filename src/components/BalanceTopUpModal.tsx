import { useEffect, useState } from 'react';
import { formatNumber } from '../helpers/formatters';

interface BalanceTopUpModalProps {
  isOpen: boolean;
  minAmount: number;
  maxAmount: number;
  step: number;
  defaultAmount: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const normalizeAmount = (value: number, minAmount: number, maxAmount: number, step: number): number => {
  const safeStep = Math.max(1, step);
  const rounded = Math.round(value / safeStep) * safeStep;
  return Math.max(minAmount, Math.min(maxAmount, rounded));
};

export const BalanceTopUpModal = ({
  isOpen,
  minAmount,
  maxAmount,
  step,
  defaultAmount,
  onClose,
  onConfirm,
}: BalanceTopUpModalProps) => {
  const [amount, setAmount] = useState<number>(
    normalizeAmount(defaultAmount, minAmount, maxAmount, step),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAmount((prevAmount) => normalizeAmount(prevAmount, minAmount, maxAmount, step));
  }, [isOpen, minAmount, maxAmount, step]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = (): void => {
    onConfirm(normalizeAmount(amount, minAmount, maxAmount, step));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-900/50 p-3 sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Пополнить баланс</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
          >
            Скрыть
          </button>
        </div>

        <p className="text-xs text-slate-500">Выберите сумму пополнения</p>

        <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Сумма</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(amount)}</p>
        </div>

        <input
          type="range"
          min={minAmount}
          max={maxAmount}
          step={step}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="mt-4 w-full accent-sky-600"
        />

        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>{formatNumber(minAmount)}</span>
          <span>{formatNumber(maxAmount)}</span>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-4 w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white active:scale-[0.99]"
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
};
