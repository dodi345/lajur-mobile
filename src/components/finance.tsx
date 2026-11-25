import { router } from "expo-router";
import type { AndroidSymbol } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Icon } from "@/components/ui";
import type { CategoryShare, Transaction, Wallet, WalletType } from "@/lib/api";
import { monthLabel, shiftMonth } from "@/lib/date";
import { formatRupiah, formatSigned } from "@/lib/money";
import { CHART_COLORS, CHART_OTHER, RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Komponen keuangan: baris transaksi, dompet, navigasi bulan, porsi kategori.

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-wallet",
  savings: "Tabungan",
  receivable: "Piutang",
  payable: "Utang",
};

const WALLET_ICONS: Record<WalletType, AndroidSymbol> = {
  cash: "payments",
  bank: "account_balance",
  ewallet: "account_balance_wallet",
  savings: "savings",
  receivable: "call_received",
  payable: "call_made",
};

/** Arah uang dari sudut pandang semua dompet user (BR-02); adjustment: dari arah from/to. */
export function transactionDirection(transaction: Transaction): "in" | "out" | "none" {
  if (transaction.type === "income") return "in";
  if (transaction.type === "expense") return "out";
  if (transaction.type === "adjustment") return transaction.toWalletId ? "in" : "out";
  return "none";
}

export function transactionTitle(transaction: Transaction): string {
  if (transaction.type === "transfer") return "Transfer";
  if (transaction.type === "adjustment") return "Saldo awal / koreksi";
  return transaction.categoryName ?? (transaction.type === "income" ? "Pemasukan" : "Pengeluaran");
}

function transactionSubtitle(transaction: Transaction): string {
  const wallets =
    transaction.type === "transfer"
      ? `${transaction.fromWalletName} → ${transaction.toWalletName}`
      : (transaction.fromWalletName ?? transaction.toWalletName ?? "");
  return transaction.note ? `${wallets} · ${transaction.note}` : wallets;
}

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const theme = useTheme();
  const direction = transactionDirection(transaction);
  const tone = transaction.type === "transfer" ? "transfer" : direction === "in" ? "income" : "expense";
  const icon: AndroidSymbol =
    transaction.type === "transfer" ? "swap_horiz" : direction === "in" ? "arrow_downward" : "arrow_upward";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${transactionTitle(transaction)}, ${formatSigned(transaction.amount, direction)}`}
      onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: String(transaction.id) } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.iconBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name={icon} size={20} color={theme[tone]} />
      </View>
      <View style={styles.rowText}>
        <AppText numberOfLines={1}>{transactionTitle(transaction)}</AppText>
        <AppText variant="label" tone="muted" numberOfLines={1}>
          {transactionSubtitle(transaction)}
        </AppText>
      </View>
      <AppText variant="amount" tone={tone} numeric>
        {formatSigned(transaction.amount, direction)}
      </AppText>
    </Pressable>
  );
}

export function WalletRow({ wallet }: { wallet: Wallet }) {
  const theme = useTheme();
  const negative = wallet.balance < 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${wallet.name}, saldo ${formatRupiah(wallet.balance)}${negative ? ", saldo minus" : ""}`}
      onPress={() => router.push({ pathname: "/wallet/[id]", params: { id: String(wallet.id) } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.iconBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Icon name={WALLET_ICONS[wallet.type]} size={20} color={theme.primary} />
      </View>
      <View style={styles.rowText}>
        <AppText numberOfLines={1}>{wallet.name}</AppText>
        <AppText variant="label" tone="muted">
          {WALLET_TYPE_LABELS[wallet.type]}
        </AppText>
      </View>
      <View style={styles.balance}>
        {/* BR-07: saldo minus diberi peringatan, tidak hanya warna. */}
        {negative && <Icon name="warning" size={18} color={theme.warning} />}
        <AppText variant="amount" tone={negative ? "warning" : "text"} numeric>
          {formatRupiah(wallet.balance)}
        </AppText>
      </View>
    </Pressable>
  );
}

export function MonthNav({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.monthNav}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bulan sebelumnya"
        onPress={() => onChange(shiftMonth(month, -1))}
        style={styles.monthButton}
      >
        <Icon name="chevron_left" color={theme.primary} />
      </Pressable>
      <AppText variant="heading">{monthLabel(month)}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bulan berikutnya"
        onPress={() => onChange(shiftMonth(month, 1))}
        style={styles.monthButton}
      >
        <Icon name="chevron_right" color={theme.primary} />
      </Pressable>
    </View>
  );
}

/** Pemasukan, pengeluaran, selisih (US-12). */
export function SummaryStats({ income, expense, net }: { income: number; expense: number; net: number }) {
  return (
    <View style={styles.stats}>
      <View style={styles.stat}>
        <AppText variant="label" tone="muted">
          Pemasukan
        </AppText>
        <AppText variant="amount" tone="income" numeric>
          {formatSigned(income, "in")}
        </AppText>
      </View>
      <View style={styles.stat}>
        <AppText variant="label" tone="muted">
          Pengeluaran
        </AppText>
        <AppText variant="amount" tone="expense" numeric>
          {formatSigned(expense, "out")}
        </AppText>
      </View>
      <View style={styles.stat}>
        <AppText variant="label" tone="muted">
          Selisih
        </AppText>
        <AppText variant="amount" tone={net < 0 ? "expense" : "text"} numeric>
          {formatRupiah(net)}
        </AppText>
      </View>
    </View>
  );
}

/** Porsi per kategori: 7 terbesar berwarna, sisanya digabung "Lainnya". Label ditulis langsung. */
export function CategoryBreakdown({ items }: { items: CategoryShare[] }) {
  const theme = useTheme();
  const top = items.slice(0, 7);
  const rest = items.slice(7);
  const rows = [
    ...top.map((item, index) => ({ key: String(item.categoryId), name: item.categoryName, total: item.total, share: item.share, color: CHART_COLORS[index]! })),
    ...(rest.length > 0
      ? [{ key: "lainnya", name: "Lainnya", total: rest.reduce((s, i) => s + i.total, 0), share: rest.reduce((s, i) => s + i.share, 0), color: CHART_OTHER }]
      : []),
  ];
  return (
    <View style={styles.breakdown}>
      {rows.map((row) => (
        <View key={row.key} style={styles.breakdownRow} accessible accessibilityLabel={`${row.name}, ${formatRupiah(row.total)}, ${Math.round(row.share * 100)} persen`}>
          <View style={styles.breakdownHead}>
            <AppText numberOfLines={1} style={styles.rowText}>
              {row.name}
            </AppText>
            <AppText variant="label" tone="muted" numeric>
              {Math.round(row.share * 100)}%
            </AppText>
            <AppText variant="amount" numeric>
              {formatRupiah(row.total)}
            </AppText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.border }]}>
            <View style={[styles.fill, { backgroundColor: row.color, width: `${Math.max(row.share * 100, 2)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 6 },
  iconBubble: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, minWidth: 0 },
  balance: { flexDirection: "row", alignItems: "center", gap: 4 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthButton: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center", borderRadius: RADIUS },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, gap: 2 },
  breakdown: { gap: 14 },
  breakdownRow: { gap: 6 },
  breakdownHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
});
