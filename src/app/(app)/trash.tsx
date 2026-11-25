import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { describeTransaction, TransactionAmount, transactionIcon } from "@/components/finance";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ErrorState, IconChip, Loading } from "@/components/ui";
import type { TrashItem } from "@/lib/api";
import { useRestoreTransaction, useTrash } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Sampah (BR-10) = app/(app)/trash/page.tsx web: transaksi yang dihapus bisa dipulihkan selama 7 hari.
export default function TrashScreen() {
  const query = useTrash();
  const items = query.data ?? [];
  return (
    <Page title="Sampah" back={() => router.back()} gap={16} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <AppText size={13} tone="mutedForeground">
        Transaksi yang dihapus bisa dipulihkan selama 7 hari. Transaksi di sini tidak dihitung di saldo maupun ringkasan.
      </AppText>
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <AppText size={14} lineHeight={20} tone="mutedForeground" style={styles.empty}>
          Sampah kosong.
        </AppText>
      ) : (
        <View style={styles.list}>
          {items.map((item) => (
            <TrashRow key={item.id} item={item} />
          ))}
        </View>
      )}
    </Page>
  );
}

function TrashRow({ item }: { item: TrashItem }) {
  const theme = useTheme();
  const toast = useToast();
  const restore = useRestoreTransaction();
  const { title, subtitle } = describeTransaction(item);
  const icon = transactionIcon(item);
  const daysLeft = Math.max(1, 7 - item.daysAgo);
  return (
    <View style={styles.row}>
      <IconChip name={icon.name} color={icon.neutral ? theme.transfer : theme.mutedForeground} />
      <View style={styles.flex}>
        <AppText weight={500} numberOfLines={1}>
          {title}
        </AppText>
        <AppText size={13} tone="mutedForeground" numberOfLines={1}>
          {subtitle}
        </AppText>
        <View style={styles.meta}>
          <TransactionAmount type={item.type} amount={item.amount} incoming={item.toWalletId !== null} size={13} weight={400} />
          <AppText size={13} tone="mutedForeground">
            {" · "}
            {item.daysAgo === 0 ? "dihapus hari ini" : `dihapus ${item.daysAgo} hari lalu`}
            {daysLeft <= 2 ? <AppText size={13} tone="warning">{` · sisa ${daysLeft} hari`}</AppText> : null}
          </AppText>
        </View>
      </View>
      <Button
        label={restore.isPending ? "Memulihkan…" : "Pulihkan"}
        variant="outline"
        disabled={restore.isPending}
        onPress={() =>
          restore.mutate(item.id, {
            onSuccess: () => toast({ message: "Transaksi dipulihkan" }),
            onError: (error) => toast({ message: error.message || "Transaksi tidak bisa dipulihkan (lebih dari 7 hari).", type: "error" }),
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  empty: { textAlign: "center", paddingVertical: 40 },
  list: { gap: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "baseline" },
});
