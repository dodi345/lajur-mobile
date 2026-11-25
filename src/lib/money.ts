// Format Rupiah sama dengan web Lajur (lib/domain/money.ts): "Rp 25.000", minus "−Rp 2.500"
// (tanda minus U+2212, spasi tak terputus). Pemisah ribuan ditulis manual (tanpa Intl) supaya hasilnya
// sama di semua HP Android.

const NBSP = " ";

/** 1250000 → "1.250.000" */
export function groupThousands(value: number): string {
  return String(Math.trunc(Math.abs(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 25000 → "Rp 25.000"; -2500 → "−Rp 2.500". */
export function formatRupiah(amount: number): string {
  return `${amount < 0 ? "−" : ""}Rp${NBSP}${groupThousands(amount)}`;
}

/** Nominal dengan tanda arah: pemasukan "+Rp 50.000", pengeluaran "−Rp 25.000", lainnya tanpa tanda. */
export function formatSigned(amount: number, direction: "in" | "out" | "none"): string {
  const base = formatRupiah(Math.abs(amount));
  if (direction === "in") return `+${base}`;
  if (direction === "out") return `−${base}`;
  return base;
}

/** Input yang sedang diketik: "1250000" / "1.250.000" → "1.250.000" (tanpa "Rp"). */
export function formatAmountInput(text: string): string {
  const digits = text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
  return digits === "" ? "" : groupThousands(Number(digits));
}

/** "1.250.000" → 1250000; kosong → null. */
export function parseAmountInput(text: string): number | null {
  const digits = text.replace(/\D/g, "");
  return digits === "" ? null : Number(digits);
}

/** 0.3862 → "38,6%" (persen id-ID web: maks. 1 desimal, koma, tanpa spasi). */
export function formatPercent(share: number): string {
  const rounded = Math.round(share * 1000) / 10;
  return `${String(rounded).replace(".", ",")}%`;
}
