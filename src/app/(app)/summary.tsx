import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { CategoryBreakdown, MonthNav, SummaryStats } from "@/components/finance";
import { Page } from "@/components/screen";
import { AppText, ErrorState, Loading } from "@/components/ui";
import type { CategoryShare } from "@/lib/api";
import { monthLabel } from "@/lib/date";
import { useSummary } from "@/lib/queries";

// Ringkasan bulanan (US-12) = app/(app)/summary/page.tsx web. Angka dari server (BR-05).
export default function SummaryScreen() {
  const params = useLocalSearchParams<{ month?: string }>();
  const [month, setMonth] = useState<string | undefined>(params.month);
  const query = useSummary(month);
  const shown = query.data?.month ?? month;

  return (
    <Page title="Ringkasan bulanan" back={() => router.back()} gap={16} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {shown ? <MonthNav month={shown} onChange={setMonth} /> : null}
      {query.isPending ? (
        <Loading label="Memuat ringkasan…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <SummaryStats income={query.data.summary.income} expense={query.data.summary.expense} net={query.data.summary.net} />
          <Breakdown
            title="Pengeluaran per kategori"
            items={query.data.summary.expenseByCategory}
            month={query.data.month}
            empty={`Belum ada pengeluaran di ${monthLabel(query.data.month)}.`}
          />
          <Breakdown
            title="Pemasukan per kategori"
            items={query.data.summary.incomeByCategory}
            month={query.data.month}
            empty={`Belum ada pemasukan di ${monthLabel(query.data.month)}.`}
          />
          <AppText size={13} tone="mutedForeground">
            Transfer antardompet dan koreksi saldo tidak dihitung sebagai pemasukan atau pengeluaran.
          </AppText>
        </>
      )}
    </Page>
  );
}

function Breakdown({ title, items, month, empty }: { title: string; items: CategoryShare[]; month: string; empty: string }) {
  return (
    <View style={styles.section}>
      <AppText weight={600} accessibilityRole="header">
        {title}
      </AppText>
      {items.length > 0 ? (
        <CategoryBreakdown items={items} month={month} />
      ) : (
        <AppText size={14} lineHeight={20} tone="mutedForeground">
          {empty}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
});
