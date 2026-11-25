import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { debtLabelOf } from "@/components/finance";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import type { Debt, Transaction } from "@/lib/api";
import { groupLabel } from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { useDebt } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Detail pinjaman (US-19) = app/(app)/debts/[id]/page.tsx web: sisa, porsi terbayar, jatuh tempo, aksi, riwayat.

const PREFIX = { receivable: "Piutang", payable: "Utang" } as const;

export default function DebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useDebt(Number(id));
  const debt = query.data?.debt;

  return (
    <Page title={debt?.counterparty ?? "Pinjaman"} back={() => router.back()} gap={20} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? (
        <Loading label="Memuat pinjaman…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <DebtDetail debt={debt!} history={query.data.history} today={query.data.today} />
      )}
    </Page>
  );
}

function DebtDetail({ debt, history, today }: { debt: Debt; history: Transaction[]; today: string }) {
  const theme = useTheme();
  const receivable = debt.type === "receivable";
  const paid = debt.total - debt.remaining;
  const share = debt.total > 0 ? paid / debt.total : 0;
  return (
    <>
      {/* Angka sisa memakai warna teks biasa + label arah (PRD §9). */}
      <View style={[styles.summary, { backgroundColor: theme.muted }]} accessibilityLabel="Ringkasan pinjaman">
        <View style={styles.tight}>
          <AppText size={13} tone="mutedForeground">
            {debt.settled ? "Lunas" : receivable ? `${debt.counterparty} masih berutang` : `Sisa utang ke ${debt.counterparty}`}
          </AppText>
          <AppText size={32} weight={700} lineHeight={40} numeric>
            {formatRupiah(debt.remaining)}
          </AppText>
        </View>
        {debt.total > 0 ? (
          <View style={styles.progress}>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Porsi yang sudah dibayar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(share * 100) }}
              style={[styles.track, { backgroundColor: theme.primary15 }]}
            >
              <View style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: theme.primary }]} />
            </View>
            <AppText size={13} tone="mutedForeground" numeric>
              Sudah dibayar {formatRupiah(paid)} dari {formatRupiah(debt.total)}
            </AppText>
          </View>
        ) : null}
        {debt.due ? (
          <AppText size={13} weight={debt.due.overdue ? 500 : 400} tone={debt.due.overdue ? "warning" : "mutedForeground"}>
            {debt.due.text}
          </AppText>
        ) : null}
      </View>

      <View style={styles.actions}>
        {!debt.settled ? (
          <Button label={receivable ? "Terima bayaran" : "Bayar utang"} big onPress={() => router.push(`/debt/${debt.id}/pay`)} />
        ) : null}
        <Button
          label={receivable ? "Pinjamkan lagi" : "Pinjam lagi"}
          variant="outline"
          onPress={() => router.push({ pathname: "/debt/new", params: { type: receivable ? "lend" : "borrow", name: debt.counterparty } })}
        />
      </View>

      <View style={styles.history}>
        <AppText size={13} weight={500} tone="mutedForeground" style={styles.inset} accessibilityRole="header">
          Riwayat
        </AppText>
        {history.length === 0 ? (
          <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.inset}>
            Belum ada transaksi.
          </AppText>
        ) : (
          history.map((transaction) => <HistoryRow key={transaction.id} debt={debt} transaction={transaction} today={today} />)
        )}
        <AppText size={13} tone="mutedForeground" style={[styles.inset, styles.note]}>
          Pinjaman dan pembayarannya tidak masuk ringkasan pemasukan/pengeluaran.
        </AppText>
      </View>
    </>
  );
}

/** Satu baris riwayat dari sudut pandang pinjaman: menambah sisa (+) atau mengurangi sisa (−). */
function HistoryRow({ debt, transaction, today }: { debt: Debt; transaction: Transaction; today: string }) {
  const theme = useTheme();
  const intoDebt = transaction.toWalletId === debt.id;
  // Piutang bertambah saat uang masuk ke dompet piutang; utang bertambah saat uang keluar dari dompet utang.
  const increases = debt.type === "receivable" ? intoDebt : !intoDebt;
  const label = debtLabelOf(transaction);
  const title = label?.label ?? PREFIX[debt.type];
  const detail = [transaction.note ? title : null, label?.wallet, groupLabel(transaction.transactionDate, today)].filter(Boolean).join(" · ");
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: String(transaction.id) } })}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.muted }]}
    >
      <View style={styles.flex}>
        <AppText weight={500} numberOfLines={1}>
          {transaction.note || title}
        </AppText>
        <AppText size={13} tone="mutedForeground" numberOfLines={1}>
          {detail}
        </AppText>
      </View>
      <AppText weight={600} numeric numberOfLines={1}>
        {increases ? "+" : "−"}
        {formatRupiah(transaction.amount)}
      </AppText>
      <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  summary: { gap: 12, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16 },
  tight: { gap: 4 },
  progress: { gap: 6 },
  track: { height: 8, borderRadius: RADIUS.full, overflow: "hidden" },
  fill: { height: "100%", borderRadius: RADIUS.full },
  actions: { gap: 8 },
  history: { gap: 4 },
  inset: { paddingHorizontal: 8 },
  note: { paddingTop: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
});
