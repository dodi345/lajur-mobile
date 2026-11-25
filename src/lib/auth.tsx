import { useQueryClient } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { ApiError, rawRequest, request, setApiToken, setUnauthorizedHandler, type User } from "@/lib/api";

// Sesi app: token sesi Better Auth (plugin bearer di server) disimpan terenkripsi di Android Keystore
// lewat SecureStore. Token = sesi biasa: muncul di Profil → Perangkat di web dan bisa dikeluarkan dari sana.

const TOKEN_KEY = "lajur.session-token";

// SecureStore tidak ada di web; versi web app hanya dipakai untuk pratinjau tampilan saat pengembangan.
const tokenStore = {
  get: () =>
    Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.getItem(TOKEN_KEY) ?? null) : SecureStore.getItemAsync(TOKEN_KEY),
  set: (value: string) =>
    Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.setItem(TOKEN_KEY, value)) : SecureStore.setItemAsync(TOKEN_KEY, value),
  remove: () =>
    Platform.OS === "web" ? Promise.resolve(globalThis.localStorage?.removeItem(TOKEN_KEY)) : SecureStore.deleteItemAsync(TOKEN_KEY),
};

type AuthStatus = "loading" | "signedOut" | "signedIn";

type AuthContextValue = {
  status: AuthStatus;
  /** null saat sesi ada tapi profil belum bisa dimuat (mis. offline saat app dibuka). */
  user: User | null;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Keluar dari semua perangkat (semua sesi akun ini dicabut di server). */
  signOutEverywhere: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Pesan Better Auth (kode) → bahasa Indonesia, sama dengan pesan web. */
export function authErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Terjadi kesalahan. Coba lagi sebentar lagi.";
  if (error.status === 0) return error.message;
  const code = error.code ?? "";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "Email atau password salah.";
  if (code.startsWith("USER_ALREADY_EXISTS")) return "Email ini sudah terdaftar. Silakan masuk.";
  if (code.includes("SIGN_UP_DISABLED")) return "Pendaftaran akun baru sedang ditutup.";
  if (code === "PASSWORD_TOO_SHORT") return "Password minimal 8 karakter.";
  if (code === "PASSWORD_TOO_LONG") return "Password maksimal 128 karakter.";
  if (code === "INVALID_EMAIL") return "Format email tidak valid.";
  if (error.status === 429) return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  return "Terjadi kesalahan. Coba lagi sebentar lagi.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<User | null>(null);

  const clearLocal = useCallback(async () => {
    setApiToken(null);
    await tokenStore.remove().catch(() => {});
    queryClient.clear();
    setUser(null);
    setStatus("signedOut");
  }, [queryClient]);

  // Token ditolak server (dikeluarkan dari web, sesi habis): kembali ke layar Masuk.
  useEffect(() => {
    setUnauthorizedHandler(() => void clearLocal());
    return () => setUnauthorizedHandler(null);
  }, [clearLocal]);

  // Saat app dibuka: pakai token tersimpan kalau masih berlaku.
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await tokenStore.get().catch(() => null);
      if (!saved) {
        if (alive) setStatus("signedOut");
        return;
      }
      setApiToken(saved);
      try {
        const { user: me } = await request<{ user: User }>("/api/v1/me");
        if (!alive) return;
        setUser(me);
        setStatus("signedIn");
      } catch (error) {
        if (!alive) return;
        if (error instanceof ApiError && error.status === 401) await clearLocal();
        // Offline: tetap masuk; layar menampilkan error + "Coba lagi".
        else setStatus("signedIn");
      }
    })();
    return () => {
      alive = false;
    };
  }, [clearLocal]);

  const acceptSession = useCallback(async (headers: Headers) => {
    const sessionToken = headers.get("set-auth-token");
    if (!sessionToken) throw new Error("Server tidak mengirim token sesi.");
    await tokenStore.set(sessionToken);
    setApiToken(sessionToken);
    const { user: me } = await request<{ user: User }>("/api/v1/me");
    setUser(me);
    setStatus("signedIn");
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      // "Ingat saya" (BR-42): sesi 7 hari dan diperpanjang selama dipakai; dimatikan = sesi pendek (maks. 24 jam).
      const { headers } = await rawRequest("/api/auth/sign-in/email", {
        method: "POST",
        body: { email: email.trim(), password, rememberMe },
      });
      await acceptSession(headers);
    },
    [acceptSession],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const { headers } = await rawRequest("/api/auth/sign-up/email", {
        method: "POST",
        body: { name: name.trim(), email: email.trim(), password },
      });
      await acceptSession(headers);
    },
    [acceptSession],
  );

  const signOut = useCallback(async () => {
    // Sesi di server ikut dihapus; kalau offline, tetap keluar di HP ini.
    await rawRequest("/api/auth/sign-out", { method: "POST", body: {} }).catch(() => {});
    await clearLocal();
  }, [clearLocal]);

  const signOutEverywhere = useCallback(async () => {
    await rawRequest("/api/auth/revoke-sessions", { method: "POST", body: {} }).catch(() => {});
    await clearLocal();
  }, [clearLocal]);

  const value = useMemo(
    () => ({ status, user, signIn, signUp, signOut, signOutEverywhere }),
    [status, user, signIn, signUp, signOut, signOutEverywhere],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth di luar AuthProvider");
  return value;
}
