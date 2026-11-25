import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { TransactionRow, WALLET_TYPE_LABELS } from "@/components/finance";
import { FormScreen } from "@/components/screen";
import { AppText, Card, ErrorState, Icon, Loading } from "@/components/ui";
import { formatRupiah } from "@/lib/money";
import { useWallet } from "@/lib/queries";
import { useTheme } from "@/lib/theme";

// Detail dompet + semua transaksinya (terbaru dulu).
export default function WalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useWallet(Number(id));
  const theme = useTheme();

  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />;
  const { wallet, transactions } = query.data;
  const negative = wallet.balance < 0;

  return (
    <FormScreen>
      <Stack.Screen options={{ title: wallet.name }} />
      <View style={styles.head}>
        <AppText variant="label" tone="muted">
          {WALLET_TYPE_LABELS[wallet.type]} · saldo
        </AppText>
        <AppText variant="hero" tone={negative ? "warning" : "text"} numeric>
          {formatRupiah(wallet.balance)}
        </AppText>
        {negative && (
          <View style={styles.warning}>
            <Icon name="warning" size={18} color={theme.warning} />
            <AppText variant="label" tone="warning" style={styles.flex}>
              Saldo minus. Cek apakah ada transaksi yang lupa dicatat.
            </AppText>
          </View>
        )}
      </View>
      <Card style={styles.card}>
        {transactions.length === 0 ? (
          <AppText tone="muted">Belum ada transaksi.</AppText>
        ) : (
          [...transactions].reverse().map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)
        )}
      </Card>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { gap: 4 },
  warning: { flexDirection: "row", alignItems: "center", gap: 6 },
  card: { paddingVertical: 6, gap: 0 },
});
