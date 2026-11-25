import { router, useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";
import { WALLET_TYPE_LABELS } from "@/components/finance";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { AppText, Button, ErrorState, Loading, TextLink } from "@/components/ui";
import { WalletLogo } from "@/components/wallet-logo";
import { API_URL } from "@/lib/api";
import { formatRupiah } from "@/lib/money";
import { useWallet } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Detail dompet = app/(app)/wallets/[id]/page.tsx web: kartu logo + saldo, peringatan saldo minus (BR-07),
// tautan ke transaksinya. Koreksi saldo, ubah nama, dan arsip belum ada di API app (tahap 2): lewat web.
export default function WalletScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const query = useWallet(Number(id));
  const wallet = query.data?.wallet;
  const negative = (wallet?.balance ?? 0) < 0;
  const archived = Boolean(wallet?.archivedAt);

  return (
    <Page title={wallet?.name ?? "Dompet"} back={() => router.back()} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.muted }]}>
            <View style={styles.row}>
              <WalletLogo type={wallet!.type} brand={wallet!.brand} />
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                {WALLET_TYPE_LABELS[wallet!.type]}
                {archived ? " · Diarsipkan" : ""}
              </AppText>
            </View>
            <View style={styles.balanceRow}>
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                Saldo di aplikasi ini
              </AppText>
              <AppText size={20} weight={700} lineHeight={28} tone={negative ? "warning" : "foreground"} numeric>
                {formatRupiah(wallet!.balance)}
              </AppText>
            </View>
          </View>

          {negative ? (
            <View style={[styles.warning, { borderColor: theme.warning30 }]}>
              <View style={styles.warningIcon}>
                <Icon name="AlertTriangle" size={20} color={theme.warning} />
              </View>
              <AppText size={14} lineHeight={20} tone="warning" style={styles.flex}>
                Saldo minus biasanya berarti ada transaksi yang lupa dicatat. Cek riwayat dulu sebelum koreksi.
              </AppText>
            </View>
          ) : null}

          <TextLink
            label={`Lihat transaksi ${wallet!.name}`}
            onPress={() => router.navigate({ pathname: "/transactions", params: { walletId: String(wallet!.id) } })}
            style={styles.selfStart}
          />

          <View style={styles.section}>
            <AppText weight={600} accessibilityRole="header">
              Koreksi saldo
            </AppText>
            <AppText size={13} tone="mutedForeground">
              Koreksi saldo, ubah nama, dan arsip dompet untuk sementara dilakukan di web Lajur.
            </AppText>
            <Button label="Buka di web" variant="outline" onPress={() => void Linking.openURL(`${API_URL}/wallets/${wallet!.id}`)} />
          </View>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: RADIUS.xl, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  warning: { flexDirection: "row", gap: 8, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  warningIcon: { marginTop: 2 },
  selfStart: { alignSelf: "flex-start", paddingHorizontal: 0 },
  section: { gap: 12 },
});
