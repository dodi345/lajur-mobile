import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SummaryStats, TransactionRow, WalletRow } from "@/components/finance";
import { TabScreen } from "@/components/screen";
import { AppText, Button, Card, EmptyState, ErrorState, Icon, Loading } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { monthLabel } from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { useHome } from "@/lib/queries";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Beranda (sama dengan / di web): kekayaan bersih, ringkasan bulan ini, dompet, transaksi terakhir.
export default function HomeScreen() {
  const { user } = useAuth();
  const home = useHome();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const hero = (
    <View style={[styles.hero, { backgroundColor: theme.hero, paddingTop: insets.top + 16 }]}>
      <View style={styles.heroHead}>
        <AppText tone="heroMuted" style={styles.flex} numberOfLines={1}>
          Halo, {user?.name ?? ""} 👋
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Akun"
          onPress={() => router.push("/profile")}
          style={styles.iconButton}
        >
          <Icon name="account_circle" size={28} color={theme.onHero} />
        </Pressable>
      </View>
      {home.data && home.data.walletCount > 0 && (
        <View accessible accessibilityLabel={`Kekayaan bersih ${formatRupiah(home.data.netWorth.total)}`}>
          <AppText variant="label" tone="heroMuted">
            Kekayaan bersih
          </AppText>
          <AppText variant="hero" tone="onHero" numeric>
            {formatRupiah(home.data.netWorth.total)}
          </AppText>
          <AppText variant="label" tone="heroMuted">
            {home.data.netWorth.note}
          </AppText>
        </View>
      )}
    </View>
  );

  return (
    <TabScreen top={hero} refreshing={home.isRefetching} onRefresh={() => void home.refetch()}>
      {home.isPending ? (
        <Loading />
      ) : home.isError ? (
        <ErrorState message={home.error.message} onRetry={() => void home.refetch()} />
      ) : home.data.walletCount === 0 ? (
        <EmptyState
          title="Mulai dengan menambah dompet"
          message="Misalnya Tunai, rekening bank, atau e-wallet, lengkap dengan saldo sekarang."
          action={<Button label="Tambah dompet" icon="add" onPress={() => router.push("/wallet/new")} />}
        />
      ) : (
        <>
          <Card>
            <SectionHead title={`Bulan ini · ${monthLabel(home.data.month)}`} action="Ringkasan" onPress={() => router.navigate("/summary")} />
            <SummaryStats income={home.data.summary.income} expense={home.data.summary.expense} net={home.data.summary.net} />
          </Card>
          <Card>
            <SectionHead
              title="Dompet"
              action={home.data.walletCount > home.data.wallets.length ? `Semua (${home.data.walletCount})` : "Semua"}
              onPress={() => router.navigate("/wallets")}
            />
            {home.data.wallets.map((wallet) => (
              <WalletRow key={wallet.id} wallet={wallet} />
            ))}
          </Card>
          <Card>
            <SectionHead title="Transaksi terakhir" action="Lihat semua" onPress={() => router.navigate("/transactions")} />
            {home.data.recentTransactions.length === 0 ? (
              <AppText tone="muted">Belum ada transaksi. Tekan + untuk mencatat.</AppText>
            ) : (
              home.data.recentTransactions.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))
            )}
          </Card>
        </>
      )}
    </TabScreen>
  );
}

function SectionHead({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHead}>
      <AppText variant="heading" style={styles.flex} numberOfLines={1}>
        {title}
      </AppText>
      <Pressable accessibilityRole="link" onPress={onPress} style={styles.sectionAction}>
        <AppText tone="primary">{action}</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { paddingHorizontal: 16, paddingBottom: 28, gap: 16, borderBottomLeftRadius: RADIUS * 2, borderBottomRightRadius: RADIUS * 2 },
  heroHead: { flexDirection: "row", alignItems: "center" },
  iconButton: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionAction: { minHeight: TOUCH, justifyContent: "center", paddingLeft: 8 },
});
