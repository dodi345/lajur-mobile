import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { ToastProvider } from "@/components/toast";
import { ApiError } from "@/lib/api";
import { AuthProvider, useAuth } from "@/lib/auth";
import { PreferencesProvider, useTheme } from "@/lib/theme";

// Layar pembuka tetap tampil sampai font Inter siap dan status login diketahui.
SplashScreen.preventAutoHideAsync();

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Error 4xx (tidak ditemukan, belum masuk) tidak diulang; gangguan jaringan diulang sekali.
        retry: (count, error) => !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
      },
    },
  });
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { status } = useAuth();
  const ready = fontsReady && status !== "loading";

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  const signedIn = status === "signedIn";
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* Masuk/Daftar langsung di stack akar (bukan grup): kalau belum login, alamat awal "/" (Beranda,
          terkunci) dialihkan ke layar pertama yang tersedia, yaitu login. Dalam grup, "/" jadi Unmatched Route. */}
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}

function Themed({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const base = theme.dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: theme.primary,
          background: theme.background,
          card: theme.background,
          text: theme.foreground,
          border: theme.border,
        },
      }}
    >
      {children}
      <StatusBar style={theme.dark ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  // Data dimuat ulang saat app kembali dibuka dari latar belakang.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => focusManager.setFocused(state === "active"));
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <AuthProvider>
          <Themed>
            <ToastProvider>
              {/* Font gagal dimuat tetap lanjut (fallback font sistem), sama dengan fallback web. */}
              <RootNavigator fontsReady={fontsLoaded || Boolean(fontError)} />
            </ToastProvider>
          </Themed>
        </AuthProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}
