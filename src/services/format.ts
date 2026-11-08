/**
 * Formatage des montants et durées selon les conventions françaises.
 * Ex: 6 113 €, 901,70 €, +365,73 €, 0 €
 */
export function formatEur(amount: number | null | undefined, showSign = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  
  const isInteger = Math.abs(amount % 1) < 0.005;
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: isInteger ? 0 : 2
  }).format(amount);

  if (showSign && amount > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('fr-FR').format(val);
}

export function formatDays(days: number): string {
  if (days <= 1) return '1 jour';
  return `${days} jours`;
}
