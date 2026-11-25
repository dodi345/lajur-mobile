import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { MonthNav, TransactionAmount, TransactionRow } from "@/components/finance";
import { OptionPicker, type PickerOption } from "@/components/picker";
import { Page } from "@/components/screen";
import { AppText, EmptyState, ErrorState, InsetCard, Loading } from "@/components/ui";
import type { Transaction, TransactionType } from "@/lib/api";
import { monthLabel } from "@/lib/date";
import { formatRupiah } from "@/lib/money";
import { useManagedCategories, useTransactions, useWallets } from "@/lib/queries";
import { font, RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Transaksi = app/(app)/transactions/page.tsx web: navigasi bulan, filter (dompet, kategori, jenis),
// total Masuk/Keluar, lalu kelompok per tanggal ("Hari ini · Rab, 25 Nov") dengan total harian.
// Total dan judul tanggal dihitung server (fungsi yang sama dengan web).

const TYPE_OPTIONS: PickerOption<TransactionType | null>[] = [
  { value: null, label: "Semua jenis" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
  { value: "adjustment", label: "Koreksi saldo" },
];

type Params = { month?: string; walletId?: string; categoryId?: string; v?: string };
const numberParam = (value: string | undefined) => (value && /^\d+$/.test(value) ? Number(value) : null);

export default function TransactionsScreen() {
  const params = useLocalSearchParams<Params>();
  const [month, setMonth] = useState<string | undefined>(params.month || undefined);
  const [walletId, setWalletId] = useState<number | null>(numberParam(params.walletId));
  const [categoryId, setCategoryId] = useState<number | null>(numberParam(params.categoryId));
  const [type, setType] = useState<TransactionType | null>(null);
  const [picker, setPicker] = useState<"wallet" | "category" | "type" | null>(null);

  // Dibuka lagi lewat tautan (openTransactions: Beranda, Ringkasan, detail dompet, nav bawah): seluruh filter
  // diganti isi tautan, yang tidak disebut kosong lagi, sama dengan tautan /transactions?… web
  // (pola "sesuaikan state saat props berubah", tanpa efek).
  const paramsKey = `${params.v ?? ""}|${params.month ?? ""}|${params.walletId ?? ""}|${params.categoryId ?? ""}`;
  const [seenParams, setSeenParams] = useState(paramsKey);
  if (paramsKey !== seenParams) {
    setSeenParams(paramsKey);
    setMonth(params.month || undefined);
    setWalletId(numberParam(params.walletId));
    setCategoryId(numberParam(params.categoryId));
    setType(null);
  }

  const query = useTransactions({
    month,
    walletId: walletId ?? undefined,
    categoryId: categoryId ?? undefined,
    type: type ?? undefined,
  });
  // Filter = web: dompet aktif + diarsipkan; kategori aktif urut dibuat (bukan urut paling sering dipakai).
  const wallets = useWallets();
  const archivedWallets = useWallets(true);
  const expenseCategories = useManagedCategories("expense");
  const incomeCategories = useManagedCategories("income");
  const data = query.data;
  const shownMonth = data?.month ?? month;

  const walletOptions: PickerOption<number | null>[] = [
    { value: null, label: "Semua dompet" },
    ...[...(wallets.data ?? []), ...(archivedWallets.data ?? [])].map((wallet) => ({ value: wallet.id, label: wallet.name })),
  ];
  const categoryOptions: PickerOption<number | null>[] = [
    { value: null, label: "Semua kategori" },
    ...(expenseCategories.data?.active ?? []).map((category) => ({ value: category.id, label: category.name })),
    ...(incomeCategories.data?.active ?? []).map((category) => ({ value: category.id, label: `${category.name} (Pemasukan)` })),
  ];
  const label = <T,>(options: PickerOption<T>[], value: T) => options.find((option) => option.value === value)?.label ?? options[0]!.label;

  return (
    <Page title="Transaksi" tab refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {shownMonth ? <MonthNav month={shownMonth} onChange={setMonth} /> : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.filters}>
        <FilterPill label={label(walletOptions, walletId)} active={walletId !== null} onPress={() => setPicker("wallet")} />
        <FilterPill label={label(categoryOptions, categoryId)} active={categoryId !== null} onPress={() => setPicker("category")} />
        <FilterPill label={label(TYPE_OPTIONS, type)} active={type !== null} onPress={() => setPicker("type")} />
      </ScrollView>

      {query.isPending ? (
        <Loading label="Memuat transaksi…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View style={styles.totals}>
            <TotalTile label="Masuk" type="income" amount={data!.totals.income} />
            <TotalTile label="Keluar" type="expense" amount={data!.totals.expense} />
          </View>
          {data!.transactions.length === 0 ? (
            <EmptyState
              message={`Belum ada transaksi di ${monthLabel(data!.month)}.`}
              link="Catat transaksi"
              onLink={() => router.push("/transaction/new")}
            />
          ) : (
            data!.days.map((day) => (
              <DayGroup key={day.date} label={day.label} net={day.net} items={data!.transactions.filter((t) => t.transactionDate === day.date)} />
            ))
          )}
        </>
      )}

      <OptionPicker visible={picker === "wallet"} title="Dompet" options={walletOptions} value={walletId} onSelect={setWalletId} onClose={() => setPicker(null)} />
      <OptionPicker visible={picker === "category"} title="Kategori" options={categoryOptions} value={categoryId} onSelect={setCategoryId} onClose={() => setPicker(null)} />
      <OptionPicker visible={picker === "type"} title="Jenis" options={TYPE_OPTIONS} value={type} onSelect={setType} onClose={() => setPicker(null)} />
    </Page>
  );
}

/** Pil filter: h-11 rounded-full border, 14 medium; aktif = garis + teks primary (web: <select> tanpa panah). */
function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.pill, { borderColor: active ? theme.primary : theme.border, backgroundColor: theme.background }]}
    >
      <AppText size={14} weight={500} lineHeight={20} numberOfLines={1} style={[font(14, 500, 20), { color: active ? theme.primary : theme.foreground }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

function TotalTile({ label, type, amount }: { label: string; type: "income" | "expense"; amount: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.muted }]}>
      <AppText size={13} tone="mutedForeground">
        {label}
      </AppText>
      <TransactionAmount type={type} amount={amount} />
    </View>
  );
}

function DayGroup({ label, net, items }: { label: string; net: number; items: Transaction[] }) {
  return (
    <View style={styles.group}>
      <View style={styles.dayHeader}>
        <AppText size={13} tone="mutedForeground">
          {label}
        </AppText>
        <AppText size={13} numeric tone={net > 0 ? "income" : net < 0 ? "expense" : "mutedForeground"}>
          {net > 0 ? "+" : net < 0 ? "−" : ""}
          {formatRupiah(Math.abs(net))}
        </AppText>
      </View>
      <InsetCard>
        {items.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </InsetCard>
    </View>
  );
}

const styles = StyleSheet.create({
  bleed: { marginHorizontal: -16 },
  filters: { gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  pill: { height: TOUCH, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 16, justifyContent: "center" },
  totals: { flexDirection: "row", gap: 8 },
  tile: { flex: 1, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  group: { gap: 8 },
  dayHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
});
