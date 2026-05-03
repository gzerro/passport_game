import { useEffect, useState } from 'react';
import { formatNumber } from '../helpers/formatters';
import { Language } from '../i18n';

interface BalanceTopUpModalProps {
  isOpen: boolean;
  minAmount: number;
  maxAmount: number;
  step: number;
  defaultAmount: number;
  language: Language;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const labelsByLanguage: Record<Language, { title: string; hide: string; chooseAmount: string; amount: string; confirm: string }> = {
  ru: {
    title: 'Пополнить баланс',
    hide: 'Скрыть',
    chooseAmount: 'Выберите сумму пополнения',
    amount: 'Сумма',
    confirm: 'Подтвердить',
  },
  en: {
    title: 'Top Up Balance',
    hide: 'Hide',
    chooseAmount: 'Choose a top-up amount',
    amount: 'Amount',
    confirm: 'Confirm',
  },
};

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
  language,
  onClose,
  onConfirm,
}: BalanceTopUpModalProps) => {
  const [amount, setAmount] = useState<number>(normalizeAmount(defaultAmount, minAmount, maxAmount, step));
  const labels = labelsByLanguage[language];

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
    <div className="fixed inset-0 z-50 flex items-end bg-[#050402bf] p-3 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-3xl border border-[#b9975f80] bg-[#1c150df8] p-4 text-[#ecdcb5] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="ritual-title text-base text-[#f6e5b9]">{labels.title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#b08f5d70] px-3 py-1 text-xs text-[#ccb88e]"
          >
            {labels.hide}
          </button>
        </div>

        <p className="text-xs text-[#cfbc8f]">{labels.chooseAmount}</p>

        <div className="mt-3 rounded-2xl border border-[#b6955f59] bg-[#281f14db] px-3 py-3">
          <p className="text-xs uppercase tracking-[0.14em] text-[#ba9f6c]">{labels.amount}</p>
          <p className="num-grobold mt-1 text-2xl font-bold text-[#f8e8bf]">{formatNumber(amount, language)}</p>
        </div>

        <input
          type="range"
          min={minAmount}
          max={maxAmount}
          step={step}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="mt-4 w-full accent-[#c8a05a]"
        />

        <div className="mt-1 flex items-center justify-between text-[11px] text-[#cdbb8f]">
          <span className="num-grobold">{formatNumber(minAmount, language)}</span>
          <span className="num-grobold">{formatNumber(maxAmount, language)}</span>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-4 w-full rounded-2xl border border-[#e0bd78] bg-[linear-gradient(165deg,#835d2c,#5e431f)] px-4 py-3 text-sm font-semibold text-[#fff2cf] active:scale-[0.99]"
        >
          {labels.confirm}
        </button>
      </div>
    </div>
  );
};
