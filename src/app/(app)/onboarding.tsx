import { router } from "expo-router";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageHeader } from "@/components/screen";
import { AppText, Loading } from "@/components/ui";
import { WalletForm } from "@/components/wallet-form";
import { useWallets } from "@/lib/queries";
import { useTheme } from "@/lib/theme";

// Halaman penuh setelah daftar = /wallets/new web untuk user tanpa dompet: "Satu langkah lagi · Siapkan dompet
// pertama" (tanpa tombol kembali). Setelah ada dompet ("Simpan & tambah dompet lain") jadi "Tambah dompet" biasa.
export default function OnboardingScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const wallets = useWallets();
  const onboarding = wallets.data?.length === 0;
  const done = () => router.dismissTo("/");

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        >
          {wallets.isPending ? (
            <Loading />
          ) : onboarding ? (
            <View style={styles.header}>
              <AppText size={13} weight={600} tone="primary">
                Satu langkah lagi
              </AppText>
              <AppText size={28} weight={700} lineHeight={35} accessibilityRole="header">
                Siapkan dompet pertama
              </AppText>
              <AppText size={15} lineHeight={22.5} tone="mutedForeground">
                Isi saldo yang ada sekarang. Angka ini dicatat sebagai saldo awal, bukan pemasukan.
              </AppText>
            </View>
          ) : (
            <PageHeader title="Tambah dompet" back={done} />
          )}
          {wallets.isPending ? null : <WalletForm onboarding={onboarding} onDone={done} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 24 },
  // pt-6 web di atas header onboarding.
  header: { gap: 6, paddingTop: 24 },
});
