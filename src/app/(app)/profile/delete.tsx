import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "@/components/icon";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { AppText, Button, FormField, FormMessage, Input, Loading } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { exportTransactionsCsv } from "@/lib/export";
import { groupThousands } from "@/lib/money";
import { useDeleteAccount, useHome, useProfile } from "@/lib/queries";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Hapus akun (US-28) = components/profile/delete-account.tsx web: ringkasan yang hilang, tawaran ekspor,
// password + ketik HAPUS (BR-22). Setelah terhapus, token di HP ini dibuang dan app kembali ke Masuk.
const CONFIRMATION = "HAPUS";

export default function DeleteAccountScreen() {
  const theme = useTheme();
  const query = useProfile();
  const home = useHome();
  const remove = useDeleteAccount();
  const { forgetSession } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const error = remove.error instanceof ApiError ? remove.error : null;
  const fieldErrors = error?.fieldErrors ?? {};
  const ready = confirmation.trim() === CONFIRMATION;

  return (
    <Sheet title="Hapus akun">
      {() => {
        if (!query.data) return <Loading />;
        if (query.data.demo) {
          return (
            <View style={[styles.note, { backgroundColor: theme.muted }]}>
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                Tidak tersedia di akun demo.
              </AppText>
            </View>
          );
        }
        const { data, counts } = query.data;
        return (
          <>
            <View style={[styles.summary, { borderColor: theme.destructive30 }]}>
              <View style={styles.summaryTitle}>
                <Icon name="AlertTriangle" size={20} color={theme.destructive} />
                <AppText weight={600} tone="destructive">
                  Yang akan hilang permanen
                </AppText>
              </View>
              <AppText weight={500} numeric>
                {`${groupThousands(data.transactions)} transaksi · ${groupThousands(data.wallets)} dompet · ${groupThousands(data.goals)} target`}
              </AppText>
              {counts.openDebts > 0 ? (
                <AppText size={14} lineHeight={20}>
                  Termasuk {counts.openDebts} catatan utang/piutang yang belum lunas.
                </AppText>
              ) : null}
              <AppText size={13} tone="mutedForeground">
                Juga kategori, akun, dan semua perangkat yang sedang masuk. Data tidak bisa dipulihkan.
              </AppText>
            </View>
            <Button
              label="Ekspor CSV dulu"
              icon="ArrowToBottom"
              variant="outline"
              onPress={() => void exportTransactionsCsv(home.data?.today).catch(() => toast({ message: "Ekspor gagal. Coba lagi sebentar lagi.", type: "error" }))}
              style={styles.exportButton}
            />
            <View style={styles.form}>
              {remove.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={remove.error.message} /> : null}
              <FormField label="Password saat ini" error={fieldErrors.password}>
                <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" invalid={Boolean(fieldErrors.password)} accessibilityLabel="Password saat ini" />
              </FormField>
              <FormField label={`Ketik ${CONFIRMATION} untuk konfirmasi`} error={fieldErrors.confirmation}>
                <Input
                  value={confirmation}
                  onChangeText={setConfirmation}
                  placeholder={CONFIRMATION}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoComplete="off"
                  invalid={Boolean(fieldErrors.confirmation)}
                  accessibilityLabel={`Ketik ${CONFIRMATION} untuk konfirmasi`}
                />
              </FormField>
              <Button
                label={remove.isPending ? "Menghapus…" : "Hapus akun permanen"}
                variant="destructive"
                big
                disabled={remove.isPending || !ready}
                onPress={() =>
                  remove.mutate(
                    { password, confirmation },
                    {
                      onSuccess: async (result) => {
                        toast({ message: result.message, type: "success" });
                        await forgetSession();
                      },
                    },
                  )
                }
              />
            </View>
          </>
        );
      }}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  note: { borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  summary: { borderWidth: 1, borderRadius: RADIUS.xl, padding: 16, gap: 8 },
  summaryTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  exportButton: { minHeight: TOUCH },
  form: { gap: 20 },
});
