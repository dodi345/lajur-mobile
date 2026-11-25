import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useColorScheme, type TextStyle } from "react-native";

// Token tampilan = persis web Lajur (money-management app/globals.css, Tailwind v4 yang sudah dihitung).
// Jangan menambah warna di luar daftar ini: app harus terlihat sama dengan PWA.

export type Theme = {
  dark: boolean;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  primary: string;
  primaryForeground: string;
  destructive: string;
  income: string;
  expense: string;
  transfer: string;
  warning: string;
  hero: string;
  heroForeground: string;
  heroMuted: string;
  /** Lingkaran dekorasi hero (putih 6% dan 4% di atas warna hero). */
  heroCircleA: string;
  heroCircleB: string;
  /** Garis pil utang di hero (hero-muted 40%). */
  heroMuted40: string;
  glassBg: string;
  glassBorder: string;
  overlay: string;
  chart1: string;
  /** primary 5% (chip terpilih, banner), 10%, 15% (track progres target), 30% (garis banner). */
  primary5: string;
  primary10: string;
  primary15: string;
  primary30: string;
  /** Baris daftar ditekan (border 40% di atas muted) dan kartu ditekan (border 50%). */
  pressedRow: string;
  pressedCard: string;
  /** Tombol destructive (10% terang / 20% gelap), ikon bahaya di kartu muted, garis 30%. */
  destructiveButton: string;
  destructiveChip: string;
  destructive30: string;
  warning30: string;
  /** Pegangan sheet (muted-foreground 40%). */
  handle: string;
  /** Latar input & tombol outline di mode gelap (input/30); di mode terang = background/muted. */
  outlineBg: string;
  inputBg: string;
  /** Kotak terang di belakang logo bank di mode gelap (foreground). */
  logoTile: string;
};

export const LIGHT: Theme = {
  dark: false,
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f8fafc",
  mutedForeground: "#475569",
  border: "#e2e8f0",
  primary: "#4f46e5",
  primaryForeground: "#ffffff",
  destructive: "#dc2626",
  income: "#047857",
  expense: "#be123c",
  transfer: "#64748b",
  warning: "#b45309",
  hero: "#4f46e5",
  heroForeground: "#ffffff",
  heroMuted: "#eef2ff",
  heroCircleA: "#5a51e7",
  heroCircleB: "#564de6",
  heroMuted40: "#8f8bef",
  glassBg: "rgba(255,255,255,0.85)",
  glassBorder: "rgba(15,23,42,0.12)",
  overlay: "rgba(15,23,42,0.28)",
  chart1: "#6366f1",
  primary5: "#f6f6fe",
  primary10: "#edecfc",
  primary15: "#dfdff9",
  primary30: "#cac8f7",
  pressedRow: "#eff3f7",
  pressedCard: "#edf1f6",
  destructiveButton: "#fce9e9",
  destructiveChip: "#f5e5e7",
  destructive30: "#f4bebe",
  warning30: "#e8cbb5",
  handle: "#b5bbc3",
  outlineBg: "#ffffff",
  inputBg: "#f8fafc",
  logoTile: "#f8fafc",
};

export const DARK: Theme = {
  dark: true,
  background: "#020617",
  foreground: "#f8fafc",
  muted: "#0f172a",
  mutedForeground: "#94a3b8",
  border: "#1e293b",
  primary: "#818cf8",
  primaryForeground: "#020617",
  destructive: "#f87171",
  income: "#34d399",
  expense: "#fb7185",
  transfer: "#94a3b8",
  warning: "#fbbf24",
  hero: "#312e81",
  heroForeground: "#ffffff",
  heroMuted: "#c7d2fe",
  heroCircleA: "#3d3b89",
  heroCircleB: "#393686",
  heroMuted40: "#6d70b3",
  glassBg: "rgba(2,6,23,0.85)",
  glassBorder: "rgba(255,255,255,0.10)",
  overlay: "rgba(0,0,0,0.55)",
  chart1: "#6366f1",
  primary5: "#080d22",
  primary10: "#0f132e",
  primary15: "#202949",
  primary30: "#282e5a",
  pressedRow: "#151e31",
  pressedCard: "#162032",
  destructiveButton: "#331b29",
  destructiveChip: "#262031",
  destructive30: "#4c2632",
  warning30: "#4d3e1b",
  handle: "#3c4557",
  outlineBg: "#0a1022",
  inputBg: "#0a1022",
  logoTile: "#f8fafc",
};

/** Radius Tailwind web (--radius 12px dikalikan skala): rounded-lg, -xl, -2xl, sheet, lembar Beranda. */
export const RADIUS = { lg: 12, xl: 16.8, xl2: 21.6, sheet: 20, homeSheet: 26.4, full: 999 } as const;
/** Area sentuh minimal (h-11) dan tinggi tombol/input besar (h-13). */
export const TOUCH = 44;
export const TALL = 52;

/** Inter seperti web (next/font). Di Android berat huruf dipilih lewat nama font, bukan fontWeight. */
export const FONT = {
  400: "Inter_400Regular",
  500: "Inter_500Medium",
  600: "Inter_600SemiBold",
  700: "Inter_700Bold",
} as const;
export type Weight = keyof typeof FONT;

/** Gaya teks: ukuran + tinggi baris persis web (line-height 1.5 kecuali disebut lain). */
export function font(size: number, weight: Weight = 400, lineHeight = size * 1.5): TextStyle {
  return { fontFamily: FONT[weight], fontSize: size, lineHeight };
}

// Pilihan tampilan per perangkat, sama dengan web (Akun → Tampilan): tema dan "Kurangi efek kaca".
export type ThemeChoice = "light" | "dark" | "system";
const THEME_KEY = "lajur.theme";
const GLASS_KEY = "lajur.glass-off";

type Preferences = {
  themeChoice: ThemeChoice;
  setThemeChoice: (choice: ThemeChoice) => void;
  glassOff: boolean;
  setGlassOff: (off: boolean) => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [themeChoice, setChoice] = useState<ThemeChoice>("system");
  const [glassOff, setGlass] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [storedTheme, storedGlass] = await Promise.all([
          SecureStore.getItemAsync(THEME_KEY),
          SecureStore.getItemAsync(GLASS_KEY),
        ]);
        if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") setChoice(storedTheme);
        setGlass(storedGlass === "1");
      } catch {
        // Pengaturan tampilan tidak wajib; bawaan tetap dipakai.
      }
    })();
  }, []);

  const setThemeChoice = useCallback((choice: ThemeChoice) => {
    setChoice(choice);
    void SecureStore.setItemAsync(THEME_KEY, choice).catch(() => undefined);
  }, []);
  const setGlassOff = useCallback((off: boolean) => {
    setGlass(off);
    void SecureStore.setItemAsync(GLASS_KEY, off ? "1" : "0").catch(() => undefined);
  }, []);

  const value = useMemo(
    () => ({ themeChoice, setThemeChoice, glassOff, setGlassOff }),
    [themeChoice, setThemeChoice, glassOff, setGlassOff],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): Preferences {
  const value = useContext(PreferencesContext);
  return value ?? { themeChoice: "system", setThemeChoice: () => undefined, glassOff: false, setGlassOff: () => undefined };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const { themeChoice } = usePreferences();
  const dark = themeChoice === "system" ? scheme === "dark" : themeChoice === "dark";
  return dark ? DARK : LIGHT;
}
