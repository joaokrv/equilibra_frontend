/**
 * Converte um Date para `YYYY-MM-DD` usando o fuso local (não UTC).
 * Evita o deslocamento de 1 dia que `toISOString()` causa no fuso BR.
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
