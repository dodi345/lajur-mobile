import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import { GoalCard } from "@/components/finance";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ErrorState, FormMessage, Loading, TextLink } from "@/components/ui";
import { shortDate } from "@/lib/date";
import { useGoal, useSetGoalArchived } from "@/lib/queries";
import { useTheme } from "@/lib/theme";

// Detail target = app/(app)/goals/[id]/page.tsx web: kartu progres, tanggal tercapai, petunjuk menabung
// (BR-08: transfer ke dompet tabungan target), arsipkan / pulihkan.
export default function GoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const query = useGoal(Number(id));
  const goal = query.data?.goal;
  const archived = Boolean(goal?.archived);
  const title = goal ? (archived ? `${goal.name} (diarsipkan)` : goal.name) : "Target";

  return (
    <Page title={title} back={() => router.back()} gap={20} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? (
        <Loading label="Memuat target…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <GoalCard goal={goal!} />
          {goal!.achievedOn ? (
            <AppText size={14} lineHeight={20} tone="income">
              Tercapai {shortDate(goal!.achievedOn)}.
            </AppText>
          ) : null}

          {/* Petunjuk menabung hanya untuk target aktif. */}
          {!archived ? (
            <View style={styles.hint}>
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                Untuk menabung, catat{" "}
                <AppText size={14} lineHeight={20} weight={500}>
                  transfer
                </AppText>{" "}
                ke dompet{" "}
                <AppText size={14} lineHeight={20} weight={500}>
                  {goal!.walletName}
                </AppText>
                . Progres ikut naik otomatis.
              </AppText>
              <View style={styles.links}>
                <TextLink label="Tabung sekarang" onPress={() => router.push(`/goal/${goal!.id}/deposit`)} style={styles.link} />
                <TextLink label="Lihat dompet" onPress={() => router.push(`/wallet/${goal!.walletId}`)} style={styles.link} />
              </View>
            </View>
          ) : null}

          <View style={[styles.section, { borderTopColor: theme.border }]}>
            <AppText weight={600} accessibilityRole="header">
              {archived ? "Pulihkan target" : "Arsipkan target"}
            </AppText>
            <AppText size={13} tone="mutedForeground">
              {archived
                ? `Target diarsipkan. Pulihkan untuk memantau progresnya lagi dari saldo dompet ${goal!.walletName}.`
                : `Target disembunyikan dan dompet ${goal!.walletName} bisa dipakai untuk target baru. Saldo dan riwayat dompet tidak berubah.`}
            </AppText>
            <ArchiveForm goalId={goal!.id} archived={archived} />
          </View>
        </>
      )}
    </Page>
  );
}

/**
 * Arsipkan: langsung ke daftar target (web tanpa toast). Pulihkan: toast "Target dipulihkan." lalu ke daftar;
 * ditolak (dompetnya dipakai target lain / diarsipkan) → pesan di atas tombol, sama dengan web.
 */
function ArchiveForm({ goalId, archived }: { goalId: number; archived: boolean }) {
  const toast = useToast();
  const change = useSetGoalArchived(goalId);
  const label = archived ? (change.isPending ? "Memulihkan…" : "Pulihkan") : change.isPending ? "Mengarsipkan…" : "Arsipkan";
  return (
    <View style={styles.form}>
      {change.error ? <FormMessage message={change.error.message} /> : null}
      <Button
        label={label}
        icon={archived ? "ArchiveArrowUp" : "Archive"}
        variant="outline"
        disabled={change.isPending}
        onPress={() =>
          change.mutate(!archived, {
            onSuccess: (result) => {
              if (archived) toast({ message: result.message, type: "success" });
              router.dismissTo("/goals");
            },
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { gap: 4 },
  links: { flexDirection: "row", flexWrap: "wrap", columnGap: 16 },
  link: { paddingHorizontal: 0 },
  section: { gap: 12, borderTopWidth: 1, paddingTop: 20 },
  form: { gap: 12 },
});
