import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { AppText, Button, ErrorState, Loading, Segmented, TextLink } from "@/components/ui";
import type { Debt, DebtType } from "@/lib/api";
import { formatRupiah } from "@/lib/money";
import { useDebts } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Utang & Piutang (US-18) = app/(app)/debts/page.tsx web: total belum lunas per arah, tab Belum lunas / Lunas,
// daftar per arah. Angka memakai warna teks biasa + label arah, bukan hijau/merah (PRD §9).

const DEBT_GROUPS: Record<DebtType, string> = { receivable: "Orang berutang ke saya", payable: "Saya berutang" };
const DEBT_TYPES: DebtType[] = ["receivable", "payable"];
const TABS = [
  { value: "open", label: "Belum lunas" },
  { value: "settled", label: "Lunas" },
] as const;

export default function DebtsScreen() {
  const theme = useTheme();
  const query = useDebts();
  const [tab, setTab] = useState<"open" | "settled">("open");
  const debts = query.data?.debts ?? [];
  const visible = debts.filter((debt) => debt.settled === (tab === "settled"));
  const total = (type: DebtType) => debts.filter((debt) => debt.type === type).reduce((sum, debt) => sum + debt.remaining, 0);

  return (
    <Page
      title="Utang & Piutang"
      back={() => router.back()}
      gap={20}
      action={<Button label="Catat" icon="Plus" variant="outline" onPress={() => router.push("/debt/new")} />}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? (
        <Loading label="Memuat pinjaman…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View style={styles.totals} accessibilityLabel="Total belum lunas">
            {DEBT_TYPES.map((type) => (
              <View key={type} style={[styles.total, { backgroundColor: theme.muted }]}>
                <AppText size={13} tone="mutedForeground">
                  {DEBT_GROUPS[type]}
                </AppText>
                <AppText size={18} weight={700} lineHeight={28} numeric numberOfLines={1}>
                  {formatRupiah(total(type))}
                </AppText>
              </View>
            ))}
          </View>

          <Segmented options={TABS} value={tab} onChange={setTab} />

          {visible.length === 0 ? (
            <View style={styles.empty}>
              <AppText weight={600} style={styles.center}>
                {tab === "open" ? "Tidak ada pinjaman berjalan" : "Belum ada pinjaman lunas"}
              </AppText>
              {tab === "open" ? (
                <>
                  <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.center}>
                    Catat uang yang kamu pinjamkan ke teman atau pinjam dari orang lain.
                  </AppText>
                  <TextLink label="Catat pinjaman" onPress={() => router.push("/debt/new")} />
                </>
              ) : null}
            </View>
          ) : (
            DEBT_TYPES.map((type) => {
              const group = visible.filter((debt) => debt.type === type);
              if (group.length === 0) return null;
              return (
                <View key={type} style={styles.group}>
                  <AppText size={13} weight={500} tone="mutedForeground" style={styles.groupTitle} accessibilityRole="header">
                    {DEBT_GROUPS[type]}
                  </AppText>
                  {group.map((debt) => (
                    <DebtRow key={debt.id} debt={debt} />
                  ))}
                </View>
              );
            })
          )}
        </>
      )}
    </Page>
  );
}

function DebtRow({ debt }: { debt: Debt }) {
  const theme = useTheme();
  const overdue = Boolean(debt.due?.overdue);
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/debt/${debt.id}`)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.muted }]}
    >
      <View style={[styles.avatar, { backgroundColor: theme.muted }]}>
        <AppText weight={600} tone="mutedForeground">
          {debt.counterparty.slice(0, 1).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.flex}>
        <AppText weight={500} numberOfLines={1}>
          {debt.counterparty}
        </AppText>
        <AppText size={13} weight={overdue ? 500 : 400} tone={overdue ? "warning" : "mutedForeground"} numberOfLines={1}>
          {debt.settled ? `Lunas · total ${formatRupiah(debt.total)}` : (debt.due?.text ?? "Tanpa jatuh tempo")}
        </AppText>
      </View>
      <View style={styles.amount}>
        <AppText weight={600} numeric numberOfLines={1}>
          {formatRupiah(debt.remaining)}
        </AppText>
        <AppText size={12} tone="mutedForeground">
          sisa
        </AppText>
      </View>
      <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  center: { textAlign: "center" },
  totals: { flexDirection: "row", gap: 8 },
  total: { flex: 1, minWidth: 0, gap: 4, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 32 },
  group: { gap: 4 },
  groupTitle: { paddingHorizontal: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.full, alignItems: "center", justifyContent: "center" },
  amount: { alignItems: "flex-end" },
});
