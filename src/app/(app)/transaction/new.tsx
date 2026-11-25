import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Sheet } from "@/components/sheet";
import { TransactionForm, useRecordTransaction } from "@/components/transaction-form";
import { AppText, Loading, TextLink } from "@/components/ui";
import { useHome, useWallets } from "@/lib/queries";

// Catat transaksi (US-06/07/08): sheet dari tombol "+". Dompet bawaan = dompet terakhir dipakai. Tersimpan →
// toast "Transaksi tersimpan." + "Batal" (menghapus lagi, BR-10); saldo jadi minus → toast peringatan (BR-07).
// Belum ada dompet aktif → ajakan menyiapkan dompet, bukan form. Sama dengan web.
export default function NewTransactionScreen() {
  const { record, submitting, fieldErrors, message } = useRecordTransaction();
  const home = useHome();
  const wallets = useWallets();
  return (
    <Sheet title="Catat transaksi">
      {({ close }) =>
        wallets.isPending ? (
          <Loading />
        ) : wallets.data?.length === 0 ? (
          <View style={styles.noWallets}>
            <AppText size={14} lineHeight={20} tone="mutedForeground">
              Belum ada dompet aktif.
            </AppText>
            <TextLink label="Siapkan dompet dulu" onPress={() => router.replace("/wallet/new")} />
          </View>
        ) : (
          <TransactionForm
            today={home.data?.today}
            defaultWalletId={home.data?.lastWalletId}
            submitting={submitting}
            fieldErrors={fieldErrors}
            message={message}
            submitLabel="Simpan"
            onSubmit={(input) => record(input, close)}
          />
        )
      }
    </Sheet>
  );
}

const styles = StyleSheet.create({
  noWallets: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 4 },
});
