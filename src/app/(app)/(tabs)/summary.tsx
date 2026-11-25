import { useState } from "react";
import { CategoryBreakdown, MonthNav, SummaryStats } from "@/components/finance";
import { TabScreen } from "@/components/screen";
import { AppText, Card, ErrorState, Loading } from "@/components/ui";
import { monthLabel } from "@/lib/date";
import { useSummary } from "@/lib/queries";

// Ringkasan bulanan (US-12). BR-05: transfer dan koreksi saldo tidak dihitung.
export default function SummaryScreen() {
  const [month, setMonth] = useState<string | undefined>(undefined);
  const query = useSummary(month);
  const shownMonth = month ?? query.data?.month;
  return (
    <TabScreen title="Ringkasan bulanan" refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {shownMonth && <MonthNav month={shownMonth} onChange={setMonth} />}
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <Card>
            <SummaryStats income={query.data.summary.income} expense={query.data.summary.expense} net={query.data.summary.net} />
          </Card>
          <Card>
            <AppText variant="heading">Pengeluaran per kategori</AppText>
            {query.data.summary.expenseByCategory.length > 0 ? (
              <CategoryBreakdown items={query.data.summary.expenseByCategory} />
            ) : (
              <AppText tone="muted">Belum ada pengeluaran di {monthLabel(query.data.month)}.</AppText>
            )}
          </Card>
          <Card>
            <AppText variant="heading">Pemasukan per kategori</AppText>
            {query.data.summary.incomeByCategory.length > 0 ? (
              <CategoryBreakdown items={query.data.summary.incomeByCategory} />
            ) : (
              <AppText tone="muted">Belum ada pemasukan di {monthLabel(query.data.month)}.</AppText>
            )}
          </Card>
          <AppText variant="label" tone="muted">
            Transfer antardompet dan koreksi saldo tidak dihitung sebagai pemasukan atau pengeluaran.
          </AppText>
        </>
      )}
    </TabScreen>
  );
}
