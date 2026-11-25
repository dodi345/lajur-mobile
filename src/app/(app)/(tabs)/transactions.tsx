import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { MonthNav, TransactionRow } from "@/components/finance";
import { TabScreen } from "@/components/screen";
import { AppText, Card, EmptyState, ErrorState, Loading, Segmented } from "@/components/ui";
import type { Transaction } from "@/lib/api";
import { groupLabel, monthLabel } from "@/lib/date";
import { useHome, useTransactions } from "@/lib/queries";

type Filter = "all" | "expense" | "income" | "transfer";

const FILTERS = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Keluar" },
  { value: "income", label: "Masuk" },
  { value: "transfer", label: "Transfer" },
] as const;

// Transaksi per bulan, dikelompokkan per tanggal (US-10), sama dengan /transactions di web.
export default function TransactionsScreen() {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("all");
  const query = useTransactions({ month, type: filter === "all" ? undefined : filter });
  const today = useHome().data?.today;
  const shownMonth = month ?? query.data?.month;

  const groups = new Map<string, Transaction[]>();
  for (const transaction of query.data?.transactions ?? []) {
    groups.set(transaction.transactionDate, [...(groups.get(transaction.transactionDate) ?? []), transaction]);
  }

  return (
    <TabScreen title="Transaksi" refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {shownMonth && <MonthNav month={shownMonth} onChange={setMonth} />}
      <Segmented options={FILTERS} value={filter} onChange={setFilter} />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : groups.size === 0 ? (
        <EmptyState title={`Tidak ada transaksi di ${monthLabel(query.data.month)}`} message="Tekan + untuk mencatat." />
      ) : (
        [...groups.entries()].map(([date, items]) => (
          <View key={date} style={styles.group}>
            <AppText variant="label" tone="muted">
              {groupLabel(date, today)}
            </AppText>
            <Card style={styles.card}>
              {items.map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
            </Card>
          </View>
        ))
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  card: { paddingVertical: 6, gap: 0 },
});
