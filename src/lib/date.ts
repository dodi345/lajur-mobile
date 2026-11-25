// Tanggal sebagai teks "YYYY-MM-DD" dan bulan "YYYY-MM", sama dengan API Lajur. "Hari ini" selalu
// dari server (zona waktu user, BR-06), bukan jam HP. Semua hitungan memakai UTC supaya tidak
// bergeser karena zona waktu HP. Nama bulan/hari ditulis manual (tanpa Intl).

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parse(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  return toIsoDate(parse(text)) === text;
}

/** "2026-11-08", -1 → "2026-11-07" */
export function shiftDay(date: string, delta: number): string {
  const value = parse(date);
  value.setUTCDate(value.getUTCDate() + delta);
  return toIsoDate(value);
}

/** "2026-11", +1 → "2026-12" */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return toIsoDate(new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1 + delta, 1))).slice(0, 7);
}

/** "2026-11" → "November 2026" */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** "2026-11-08" → "Min, 8 Nov" */
export function dayLabel(date: string): string {
  const value = parse(date);
  return `${DAYS_SHORT[value.getUTCDay()]}, ${value.getUTCDate()} ${MONTHS_SHORT[value.getUTCMonth()]}`;
}

/** Label grup harian: "Hari ini · Min, 8 Nov", "Kemarin · Sab, 7 Nov", atau "Jum, 6 Nov" (sama dengan web). */
export function groupLabel(date: string, today: string | undefined): string {
  if (today && date === today) return `Hari ini · ${dayLabel(date)}`;
  if (today && date === shiftDay(today, -1)) return `Kemarin · ${dayLabel(date)}`;
  return dayLabel(date);
}

/** "08/11/2026" → "2026-11-08"; selain itu null. */
export function parseDisplayDate(text: string): string | null {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2]!.padStart(2, "0")}-${match[1]!.padStart(2, "0")}`;
  return isIsoDate(iso) ? iso : null;
}

/** "2026-11-08" → "08/11/2026" */
export function displayDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** "2026-08-12" → "12 Agu 2026" (formatShortDate web). */
export function shortDate(date: string): string {
  const value = parse(date);
  return `${value.getUTCDate()} ${MONTHS_SHORT[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}
