import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ErrorState, FormMessage, IconChip, Loading } from "@/components/ui";
import { useRevokeOtherSessions, useSessions } from "@/lib/queries";
import { RADIUS } from "@/lib/theme";

// Perangkat yang login (US-27) = app/(app)/profile/sessions/page.tsx web.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** "25 Nov 2026, 14.05" di zona waktu user (Intl id-ID dateStyle medium + timeStyle short, seperti web). */
function lastActiveLabel(iso: string, timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(iso));
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
    return `${Number(part("day"))} ${MONTHS[Number(part("month")) - 1]} ${part("year")}, ${part("hour")}.${part("minute")}`;
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

export default function SessionsScreen() {
  const query = useSessions();
  const revoke = useRevokeOtherSessions();
  const toast = useToast();
  const sessions = query.data?.sessions ?? [];
  const others = sessions.filter((session) => !session.current).length;

  return (
    <Page title="Perangkat yang login" back={() => router.back()} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? (
        <Loading label="Memuat perangkat…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View>
            {sessions.map((session) => (
              <View key={session.id} style={styles.row}>
                <IconChip name="Devices" />
                <View style={styles.flex}>
                  <AppText weight={500} numberOfLines={1}>
                    {session.label}
                  </AppText>
                  <AppText size={13} tone="mutedForeground">
                    {session.current ? "Sedang dipakai" : `Terakhir aktif ${lastActiveLabel(session.lastActiveAt, query.data.timezone)}`}
                  </AppText>
                </View>
                {session.current ? (
                  <AppText size={12} weight={600} tone="primary">
                    Perangkat ini
                  </AppText>
                ) : null}
              </View>
            ))}
          </View>
          <View style={styles.revoke}>
            {revoke.error ? <FormMessage message={revoke.error.message} /> : null}
            <Button
              label={revoke.isPending ? "Memproses…" : "Keluar dari perangkat lain"}
              variant="outline"
              disabled={revoke.isPending || others === 0}
              onPress={() => revoke.mutate(undefined, { onSuccess: (result) => toast({ message: result.message, type: "success" }) })}
            />
            <AppText size={13} tone="mutedForeground" style={styles.center}>
              {others === 0 ? "Hanya perangkat ini yang sedang masuk." : "Perangkat ini tetap masuk."}
            </AppText>
          </View>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
  revoke: { gap: 8 },
  center: { textAlign: "center" },
});
