export function formatDateFr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
}
