const numberFormatter = new Intl.NumberFormat('ru-RU');

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatCoefficient = (value: number): string => value.toFixed(2).replace(/\.00$/, '');

export const formatClockTime = (timestamp: number): string => timeFormatter.format(new Date(timestamp));

export const formatCountdown = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${mins}:${secs}`;
};
