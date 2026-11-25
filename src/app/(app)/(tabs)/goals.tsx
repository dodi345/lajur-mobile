import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AchievedGoalRow, GoalCard } from "@/components/finance";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { AppText, Button, EmptyState, ErrorState, Loading } from "@/components/ui";
import { formatRupiah } from "@/lib/money";
import { useGoals } from "@/lib/queries";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Target (US-13) = app/(app)/goals/page.tsx web: aktif, tercapai, diarsipkan. Progres dari server (BR-08).

const newGoal = () => router.push("/goal/new");
const openGoal = (id: number) => router.push(`/goal/${id}`);

export default function GoalsScreen() {
  const theme = useTheme();
  const query = useGoals();
  const [archivedOpen, setArchivedOpen] = useState(false);
  const goals = query.data?.goals ?? [];
  const archived = query.data?.archived ?? [];
  const active = goals.filter((goal) => !goal.progress.achieved);
  const achieved = goals.filter((goal) => goal.progress.achieved);

  return (
    <Page
      title="Target"
      tab
      gap={20}
      action={<Button label="Tambah" icon="Plus" variant="outline" onPress={newGoal} />}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? (
        <Loading label="Memuat target…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : goals.length === 0 && archived.length === 0 ? (
        <EmptyState
          title="Belum ada target"
          message="Buat target, misalnya dana darurat atau liburan, lalu pantau progresnya."
          link="Buat target pertama"
          onLink={newGoal}
        />
      ) : (
        <>
          {active.length > 0 ? (
            <View style={styles.section}>
              <AppText size={13} weight={500} tone="mutedForeground">
                Aktif
              </AppText>
              {active.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onPress={() => openGoal(goal.id)} />
              ))}
            </View>
          ) : null}
          {achieved.length > 0 ? (
            <View style={styles.achieved}>
              <AppText size={13} weight={500} tone="mutedForeground">
                Tercapai
              </AppText>
              {achieved.map((goal) => (
                <AchievedGoalRow key={goal.id} goal={goal} onPress={() => openGoal(goal.id)} />
              ))}
            </View>
          ) : null}
          {archived.length > 0 ? (
            <View style={[styles.archived, { borderColor: theme.border }]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: archivedOpen }} onPress={() => setArchivedOpen((open) => !open)} style={styles.archivedHead}>
                <AppText size={14} weight={500} lineHeight={20}>
                  Diarsipkan ({archived.length})
                </AppText>
                <View style={archivedOpen && styles.rotated}>
                  <Icon name="ChevronRight" size={20} color={theme.foreground} />
                </View>
              </Pressable>
              {archivedOpen ? (
                <View style={[styles.archivedBody, { borderTopColor: theme.border }]}>
                  {archived.map((goal) => (
                    <Pressable
                      key={goal.id}
                      accessibilityRole="button"
                      onPress={() => openGoal(goal.id)}
                      style={({ pressed }) => [styles.archivedRow, pressed && { backgroundColor: theme.muted }]}
                    >
                      <View style={styles.flex}>
                        <AppText weight={500} numberOfLines={1}>
                          {goal.name}
                        </AppText>
                        <AppText size={13} tone="mutedForeground" numeric>
                          {formatRupiah(goal.targetAmount)} · Dompet: {goal.walletName}
                        </AppText>
                      </View>
                      <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
          <AppText size={13} tone="mutedForeground">
            Progres dihitung otomatis dari saldo dompet tabungan. Untuk menabung, catat transfer ke dompet itu.
          </AppText>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  section: { gap: 8 },
  achieved: { gap: 4 },
  archived: { borderWidth: 1, borderRadius: RADIUS.xl },
  archivedHead: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  rotated: { transform: [{ rotate: "90deg" }] },
  archivedBody: { borderTopWidth: 1, padding: 8 },
  archivedRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8, opacity: 0.7 },
});
