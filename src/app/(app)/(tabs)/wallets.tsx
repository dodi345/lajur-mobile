import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { WalletRow } from "@/components/finance";
import { TabScreen } from "@/components/screen";
import { AppText, Button, Card, EmptyState, ErrorState, Loading } from "@/components/ui";
import { formatRupiah } from "@/lib/money";
import { useWallets } from "@/lib/queries";

// Daftar dompet + saldo (BR-03: saldo dihitung dari transaksi di server).
export default function WalletsScreen() {
  const wallets = useWallets();
  const total = (wallets.data ?? []).reduce((sum, wallet) => sum + wallet.balance, 0);
  return (
    <TabScreen title="Dompet" refreshing={wallets.isRefetching} onRefresh={() => void wallets.refetch()}>
      {wallets.isPending ? (
        <Loading />
      ) : wallets.isError ? (
        <ErrorState message={wallets.error.message} onRetry={() => void wallets.refetch()} />
      ) : wallets.data.length === 0 ? (
        <EmptyState
          title="Belum ada dompet"
          message="Tambahkan dompet pertama beserta saldonya sekarang."
          action={<Button label="Tambah dompet" icon="add" onPress={() => router.push("/wallet/new")} />}
        />
      ) : (
        <>
          <View style={styles.total}>
            <AppText variant="label" tone="muted">
              Total {wallets.data.length} dompet aktif
            </AppText>
            <AppText variant="title" tone={total < 0 ? "expense" : "text"} numeric>
              {formatRupiah(total)}
            </AppText>
          </View>
          <Card style={styles.card}>
            {wallets.data.map((wallet) => (
              <WalletRow key={wallet.id} wallet={wallet} />
            ))}
          </Card>
          <Button label="Tambah dompet" variant="secondary" icon="add" onPress={() => router.push("/wallet/new")} />
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  total: { gap: 2 },
  card: { paddingVertical: 6, gap: 0 },
});
