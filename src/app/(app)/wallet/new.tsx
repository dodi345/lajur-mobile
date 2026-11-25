import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import { Sheet } from "@/components/sheet";
import { AppText } from "@/components/ui";
import { WalletForm } from "@/components/wallet-form";
import { useWallets } from "@/lib/queries";

// Tambah dompet (US-03) sebagai sheet. Belum punya dompet aktif → "Siapkan dompet pertama" + "Mulai mencatat"
// (lalu ke Beranda), sama dengan sheet web dari kartu onboarding di Beranda.
export default function NewWalletScreen() {
  const onboarding = useWallets().data?.length === 0;
  const start = useRef(false);
  return (
    <Sheet
      title={onboarding ? "Siapkan dompet pertama" : "Tambah dompet"}
      onClosed={() => (start.current ? router.dismissTo("/") : router.back())}
    >
      {({ close }) => (
        <>
          {onboarding ? (
            <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.description}>
              Isi saldo yang ada sekarang. Angka ini dicatat sebagai saldo awal, bukan pemasukan.
            </AppText>
          ) : null}
          <WalletForm
            onboarding={onboarding}
            onDone={() => {
              start.current = onboarding;
              close();
            }}
          />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  // Keterangan di bawah judul (FormHeader web: 6px dari judul); sheet memberi jarak 24px antar blok.
  description: { marginTop: -18 },
});
