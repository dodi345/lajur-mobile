import { useColorScheme } from "react-native";

// Token warna = sama dengan web Lajur (money-management: docs/technical-design.md §9 dan blok .dark
// di app/globals.css). Warna hanya untuk makna: pengeluaran merah dengan "−", pemasukan hijau dengan "+",
// transfer abu-abu; aksi berbahaya (destructive) selalu punya label teks.

export type Theme = {
  background: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  income: string;
  expense: string;
  transfer: string;
  warning: string;
  destructive: string;
  hero: string;
  onHero: string;
  heroMuted: string;
};

export const LIGHT: Theme = {
  background: "#FFFFFF",
  card: "#F8FAFC",
  border: "#E2E8F0",
  text: "#0F172A",
  textMuted: "#475569",
  primary: "#4F46E5",
  onPrimary: "#FFFFFF",
  income: "#047857",
  expense: "#BE123C",
  transfer: "#64748B",
  warning: "#B45309",
  destructive: "#DC2626",
  hero: "#4F46E5",
  onHero: "#FFFFFF",
  heroMuted: "#EEF2FF",
};

export const DARK: Theme = {
  background: "#020617",
  card: "#0F172A",
  border: "#1E293B",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  primary: "#818CF8",
  onPrimary: "#020617",
  income: "#34D399",
  expense: "#FB7185",
  transfer: "#94A3B8",
  warning: "#FBBF24",
  destructive: "#F87171",
  hero: "#312E81",
  onHero: "#FFFFFF",
  heroMuted: "#C7D2FE",
};

/** Tema mengikuti pengaturan HP (terang/gelap). */
export function useTheme(): Theme {
  return useColorScheme() === "dark" ? DARK : LIGHT;
}

/** Grafik kategori: palet terpisah dari warna semantik (technical-design §9); "Lainnya" abu-abu. */
export const CHART_COLORS = ["#6366F1", "#0EA5E9", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"];
export const CHART_OTHER = "#94A3B8";

export const RADIUS = 12;
/** Area sentuh minimal (technical-design §9). */
export const TOUCH = 44;
