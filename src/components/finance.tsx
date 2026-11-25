import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, type BoxIconName } from "@/components/icon";
import { AppText, IconChip, type Tone } from "@/components/ui";
import { WalletLogo } from "@/components/wallet-logo";
import type { CategoryShare, Goal, Transaction, TransactionType, Wallet, WalletType } from "@/lib/api";
import { BOXICONS } from "@/lib/boxicons";
import { monthLabel, shiftMonth, shortDate } from "@/lib/date";
import { formatPercent, formatRupiah } from "@/lib/money";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Komponen keuangan = web Lajur (transaction-row, transaction-amount, wallet-list, month-nav,
// summary-stats, category-breakdown, goal-progress) dengan ukuran dan teks yang sama.

export const WALLET_TYPE_LABELS: Record<WalletType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-wallet",
  savings: "Tabungan",
  receivable: "Piutang",
  payable: "Utang",
};

/**
 * Buka tab Transaksi dengan filter baru (= tautan /transactions?… web yang mengganti seluruh query):
 * filter yang tidak disebut ikut kosong (bulan ini, semua dompet/kategori/jenis). `v` membuat setiap
 * pembukaan terbaca sebagai perubahan walau filternya sama.
 */
export function openTransactions(filter: { month?: string; walletId?: number; categoryId?: number } = {}) {
  router.navigate({
    pathname: "/transactions",
    params: {
      month: filter.month ?? "",
      walletId: filter.walletId ? String(filter.walletId) : "",
      categoryId: filter.categoryId ? String(filter.categoryId) : "",
      v: String(Date.now()),
    },
  });
}

/** Ikon kategori dari kolom categories.icon (nama Boxicons); kosong/tidak dikenal → Tag. */
export function categoryIcon(name: string | null | undefined): BoxIconName {
  return name && name in BOXICONS ? (name as BoxIconName) : "Tag";
}

const isDebtWallet = (type: WalletType | null) => type === "receivable" || type === "payable";

/** Nominal bertanda: pengeluaran "−" merah, pemasukan "+" hijau, transfer tanpa tanda, koreksi +/− abu-abu. */
export function TransactionAmount({
  type,
  amount,
  incoming,
  size = 16,
  lineHeight,
  weight = 600,
}: {
  type: TransactionType;
  amount: number;
  /** Koreksi saldo: true kalau uang masuk ke dompet. */
  incoming?: boolean;
  size?: number;
  lineHeight?: number;
  /** Sampah: 400 (web: font-normal). */
  weight?: 400 | 600;
}) {
  let sign = "";
  let tone: Tone = "transfer";
  if (amount === 0) tone = "foreground";
  else if (type === "expense") [sign, tone] = ["−", "expense"];
  else if (type === "income") [sign, tone] = ["+", "income"];
  else if (type === "adjustment") sign = incoming ? "+" : "−";
  return (
    <AppText size={size} weight={weight} tone={tone} lineHeight={lineHeight} numeric numberOfLines={1}>
      {sign}
      {formatRupiah(Math.abs(amount))}
    </AppText>
  );
}

/**
 * Label "bahasa manusia" untuk transaksi yang menyentuh dompet pinjaman (describeDebtTransaction web),
 * mis. "Pinjamkan ke Andi" + "dari BSI". null kalau transaksi tidak menyentuh dompet pinjaman.
 */
export function debtLabelOf(t: Transaction): { label: string; wallet: string | null; counterparty: string } | null {
  const toDebt = isDebtWallet(t.toWalletType) ? t.toWalletType : null;
  const fromDebt = isDebtWallet(t.fromWalletType) ? t.fromWalletType : null;

  // US-21: pinjaman lama dicatat sebagai adjustment ke/dari dompet pinjaman.
  if (t.type === "adjustment") {
    if (toDebt === "receivable" && t.toCounterparty) {
      return { label: `Pinjaman lama ke ${t.toCounterparty}`, wallet: null, counterparty: t.toCounterparty };
    }
    if (fromDebt === "payable" && t.fromCounterparty) {
      return { label: `Pinjaman lama dari ${t.fromCounterparty}`, wallet: null, counterparty: t.fromCounterparty };
    }
    return null;
  }

  if (t.type !== "transfer") return null;
  if (toDebt && t.toCounterparty) {
    const name = t.toCounterparty;
    return { label: toDebt === "receivable" ? `Pinjamkan ke ${name}` : `Bayar ke ${name}`, wallet: `dari ${t.fromWalletName}`, counterparty: name };
  }
  if (fromDebt && t.fromCounterparty) {
    const name = t.fromCounterparty;
    return { label: fromDebt === "receivable" ? `${name} membayar` : `Pinjam dari ${name}`, wallet: `ke ${t.toWalletName}`, counterparty: name };
  }
  return null;
}

/** Judul & keterangan baris (describeTransaction web): catatan atau nama kategori, lalu kategori · dompet. */
export function describeTransaction(t: Transaction): { title: string; subtitle: string } {
  const debt = debtLabelOf(t);
  if (debt) {
    const where = debt.wallet ? ` · ${debt.wallet}` : "";
    return t.note ? { title: t.note, subtitle: `${debt.label}${where}` } : { title: debt.label, subtitle: `Utang & piutang${where}` };
  }
  if (t.type === "transfer") {
    return { title: t.note || "Transfer", subtitle: `Transfer · ${t.fromWalletName} → ${t.toWalletName}` };
  }
  if (t.type === "adjustment") {
    return { title: t.note || "Koreksi saldo", subtitle: `Koreksi saldo · ${t.toWalletName ?? t.fromWalletName}` };
  }
  const wallet = t.type === "income" ? t.toWalletName : t.fromWalletName;
  return { title: t.note || t.categoryName || "", subtitle: `${t.categoryName} · ${wallet}` };
}

/** Ikon transaksi (TransactionIcon web): pinjaman Handshake, transfer ArrowLeftRight, koreksi SliderAlt (warna transfer). */
export function transactionIcon(t: Transaction): { name: BoxIconName; neutral: boolean } {
  if (t.type === "transfer" || t.type === "adjustment") {
    return { name: debtLabelOf(t) ? "Handshake" : t.type === "transfer" ? "ArrowLeftRight" : "SliderAlt", neutral: true };
  }
  return { name: categoryIcon(t.categoryIcon), neutral: false };
}

/** Baris transaksi (min 64px) di dalam kartu muted; ketuk → sheet edit. */
export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const theme = useTheme();
  const { title, subtitle } = describeTransaction(transaction);
  const { name: icon, neutral } = transactionIcon(transaction);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: String(transaction.id) } })}
      style={({ pressed }) => [styles.txRow, pressed && { backgroundColor: theme.pressedRow }]}
    >
      <IconChip name={icon} background={theme.background} color={neutral ? theme.transfer : theme.mutedForeground} />
      <View style={styles.flex}>
        <AppText weight={500} numberOfLines={1}>
          {title}
        </AppText>
        <AppText size={13} tone="mutedForeground" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <TransactionAmount type={transaction.type} amount={transaction.amount} incoming={transaction.toWalletId !== null} />
    </Pressable>
  );
}

/** Kartu dompet di Beranda (lebar 160): logo, nama, saldo, peringatan saldo minus. */
export function WalletCard({ wallet }: { wallet: Wallet }) {
  const theme = useTheme();
  const negative = wallet.balance < 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${wallet.name}, saldo ${formatRupiah(wallet.balance)}${negative ? ", saldo minus" : ""}`}
      onPress={() => router.push({ pathname: "/wallet/[id]", params: { id: String(wallet.id) } })}
      style={({ pressed }) => [styles.walletCard, { backgroundColor: pressed ? theme.pressedCard : theme.muted }]}
    >
      <WalletLogo type={wallet.type} brand={wallet.brand} />
      <AppText size={14} weight={500} lineHeight={20} numberOfLines={1}>
        {wallet.name}
      </AppText>
      <AppText weight={600} tone={negative ? "warning" : "foreground"} numeric numberOfLines={1}>
        {formatRupiah(wallet.balance)}
      </AppText>
      {negative && (
        <View style={styles.inline}>
          <Icon name="AlertTriangle" size={16} color={theme.warning} />
          <AppText size={12} tone="warning">
            Saldo minus
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

/** Baris dompet di halaman Dompet (tanpa kartu): logo, nama + jenis, saldo, chevron. */
export function WalletRow({ wallet }: { wallet: Wallet }) {
  const theme = useTheme();
  const negative = wallet.balance < 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: "/wallet/[id]", params: { id: String(wallet.id) } })}
      style={({ pressed }) => [styles.walletRow, pressed && { backgroundColor: theme.muted }]}
    >
      <WalletLogo type={wallet.type} brand={wallet.brand} />
      <View style={styles.flex}>
        <AppText weight={500} numberOfLines={2}>
          {wallet.name}
        </AppText>
        {negative ? (
          <View style={styles.inline}>
            <Icon name="AlertTriangle" size={16} color={theme.warning} />
            <AppText size={13} tone="warning">
              Saldo minus · cek saldo
            </AppText>
          </View>
        ) : (
          <AppText size={13} tone="mutedForeground">
            {WALLET_TYPE_LABELS[wallet.type]}
          </AppText>
        )}
      </View>
      <AppText weight={600} tone={negative ? "warning" : "foreground"} numeric>
        {formatRupiah(wallet.balance)}
      </AppText>
      <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
    </Pressable>
  );
}

/** ‹ November 2026 › (tombol 44×44, chevron 24). */
export function MonthNav({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.monthNav}>
      <Pressable accessibilityRole="button" accessibilityLabel="Bulan sebelumnya" onPress={() => onChange(shiftMonth(month, -1))} style={styles.monthButton}>
        <Icon name="ChevronLeft" size={24} color={theme.foreground} />
      </Pressable>
      <AppText weight={600}>{monthLabel(month)}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Bulan berikutnya" onPress={() => onChange(shiftMonth(month, 1))} style={styles.monthButton}>
        <Icon name="ChevronRight" size={24} color={theme.foreground} />
      </Pressable>
    </View>
  );
}

/** Kartu Pemasukan / Pengeluaran / Selisih (Beranda dan Ringkasan). */
export function SummaryStats({ income, expense, net }: { income: number; expense: number; net: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.stats, { backgroundColor: theme.muted }]}>
      <View style={styles.statRow}>
        <AppText size={14} lineHeight={20} tone="mutedForeground">
          Pemasukan
        </AppText>
        <TransactionAmount type="income" amount={income} />
      </View>
      <View style={styles.statRow}>
        <AppText size={14} lineHeight={20} tone="mutedForeground">
          Pengeluaran
        </AppText>
        <TransactionAmount type="expense" amount={expense} />
      </View>
      <View style={[styles.statRow, styles.statTotal, { borderTopColor: theme.border }]}>
        <AppText size={14} weight={500} lineHeight={20}>
          Selisih
        </AppText>
        <AppText size={18} weight={600} lineHeight={28} numeric tone={net > 0 ? "income" : net < 0 ? "expense" : "foreground"}>
          {net > 0 ? "+" : net < 0 ? "−" : ""}
          {formatRupiah(Math.abs(net))}
        </AppText>
      </View>
    </View>
  );
}

/** Bar per kategori: satu warna (chart-1), lebar relatif ke porsi terbesar, ikon 32px, chevron. */
export function CategoryBreakdown({ items, month }: { items: CategoryShare[]; month: string }) {
  const theme = useTheme();
  const largest = Math.max(...items.map((item) => item.share), 0);
  return (
    <View>
      {items.map((item) => {
        const width = largest > 0 ? Math.max((item.share / largest) * 100, 2) : 2;
        return (
          <Pressable
            key={item.categoryId}
            accessibilityRole="button"
            accessibilityLabel={`${item.categoryName}, ${formatRupiah(item.total)}, ${formatPercent(item.share)}`}
            onPress={() =>
              openTransactions({ month, categoryId: item.categoryId })
            }
            style={({ pressed }) => [styles.breakdownRow, pressed && { backgroundColor: theme.muted }]}
          >
            <IconChip name={categoryIcon(item.categoryIcon)} size={32} />
            <View style={[styles.flex, styles.breakdownBody]}>
              <View style={styles.breakdownLine}>
                <AppText size={14} weight={500} lineHeight={20} numberOfLines={1} style={styles.shrink}>
                  {item.categoryName}
                </AppText>
                <AppText size={14} lineHeight={20} numeric>
                  {formatRupiah(item.total)}
                  <AppText size={14} lineHeight={20} tone="mutedForeground">
                    {` · ${formatPercent(item.share)}`}
                  </AppText>
                </AppText>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { width: `${width}%`, backgroundColor: theme.chart1 }]} />
              </View>
            </View>
            <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
          </Pressable>
        );
      })}
    </View>
  );
}

function percentLabel(share: number, achieved: boolean) {
  return achieved ? 100 : Math.min(Math.round(share * 100), 99);
}

function deadlineText(goal: Goal): { text: string; late: boolean } | null {
  const { daysLeft } = goal.progress;
  if (!goal.deadline || daysLeft === null) return null;
  if (daysLeft > 0) return { text: `Tenggat ${shortDate(goal.deadline)} · ${daysLeft} hari lagi`, late: false };
  if (daysLeft === 0) return { text: "Tenggat hari ini", late: false };
  return { text: `Lewat tenggat ${Math.abs(daysLeft)} hari (${shortDate(goal.deadline)})`, late: true };
}

/** Kartu target aktif: nama, dompet, %, batang progres, terkumpul dari target, sisa, tenggat. */
export function GoalCard({ goal, onPress }: { goal: Goal; onPress?: () => void }) {
  const theme = useTheme();
  const { share, achieved, remaining } = goal.progress;
  const deadline = deadlineText(goal);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.goalCard, { backgroundColor: pressed ? theme.pressedCard : theme.muted }]}
    >
      <View style={styles.goalTop}>
        <View style={styles.flex}>
          <AppText weight={600} numberOfLines={1}>
            {goal.name}
          </AppText>
          <AppText size={13} tone="mutedForeground" numberOfLines={1}>
            Dompet: {goal.walletName}
          </AppText>
        </View>
        <View style={styles.inline}>
          <AppText size={20} weight={700} lineHeight={28} numeric>
            {percentLabel(share, achieved)}%
          </AppText>
          {onPress ? <Icon name="ChevronRight" size={20} color={theme.mutedForeground} /> : null}
        </View>
      </View>
      <View style={[styles.goalTrack, { backgroundColor: theme.primary15 }]}>
        <View style={[styles.goalFill, { width: `${Math.round(share * 100)}%`, backgroundColor: theme.primary }]} />
      </View>
      <AppText size={14} lineHeight={20} numeric>
        {formatRupiah(Math.max(goal.balance, 0))}{" "}
        <AppText size={14} lineHeight={20} tone="mutedForeground">
          dari {formatRupiah(goal.targetAmount)}
        </AppText>
      </AppText>
      <AppText size={13} tone="mutedForeground">
        {achieved ? "Target tercapai" : `Sisa ${formatRupiah(remaining)}`}
        {deadline && !achieved ? (
          <AppText size={13} tone={deadline.late ? "warning" : "mutedForeground"}>{`  · ${deadline.text}`}</AppText>
        ) : null}
      </AppText>
    </Pressable>
  );
}

/** Baris target tercapai: CheckCircle terisi hijau, nama, "Rp X · tercapai 12 Agu 2026". */
export function AchievedGoalRow({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.achievedRow, pressed && { backgroundColor: theme.muted }]}
    >
      <Icon name="CheckCircle" size={24} filled color={theme.income} />
      <View style={styles.flex}>
        <AppText weight={500} numberOfLines={1}>
          {goal.name}
        </AppText>
        <AppText size={13} tone="mutedForeground" numeric>
          {formatRupiah(goal.targetAmount)} · tercapai {goal.achievedOn ? shortDate(goal.achievedOn) : "hari ini"}
        </AppText>
      </View>
      <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  inline: { flexDirection: "row", alignItems: "center", gap: 4 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 8 },
  walletCard: { width: 160, borderRadius: RADIUS.xl, padding: 12, gap: 8 },
  walletRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthButton: { width: TOUCH, height: TOUCH, borderRadius: RADIUS.lg, alignItems: "center", justifyContent: "center" },
  stats: { borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 4 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, paddingVertical: 10 },
  statTotal: { borderTopWidth: 1, paddingVertical: 12 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
  breakdownBody: { gap: 6 },
  breakdownLine: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  barTrack: { height: 8, width: "100%" },
  bar: { height: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  goalCard: { borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
  goalTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  goalTrack: { height: 8, borderRadius: RADIUS.full, overflow: "hidden" },
  goalFill: { height: 8, borderRadius: RADIUS.full },
  achievedRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
});
