const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('es-CO');

const date = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatCurrency = (value: number): string => currency.format(value);
export const formatNumber = (value: number): string => number.format(value);

// SQLite guarda la fecha en UTC sin la Z
export function parseApiDate(value: string): Date {
  return new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
}

export const formatDate = (value: string): string => date.format(parseApiDate(value));
