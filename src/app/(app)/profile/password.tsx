import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { AppText, Button, FormField, FormMessage, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useChangePassword } from "@/lib/queries";

// Ganti password (US-26, BR-22, BR-23) = ChangePasswordForm web. Semua sesi lama dicabut; server memberi
// token baru untuk HP ini supaya tetap masuk.
export default function PasswordScreen() {
  const change = useChangePassword();
  const { replaceToken } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const error = change.error instanceof ApiError ? change.error : null;
  const fieldErrors = error?.fieldErrors ?? {};

  return (
    <Sheet title="Ganti password">
      {({ close }) => (
        <View style={styles.form}>
          {change.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={change.error.message} /> : null}
          <FormField label="Password saat ini" error={fieldErrors.currentPassword}>
            <Input value={current} onChangeText={setCurrent} secureTextEntry autoFocus autoComplete="current-password" invalid={Boolean(fieldErrors.currentPassword)} accessibilityLabel="Password saat ini" />
          </FormField>
          <FormField label="Password baru" hint="Minimal 8 karakter, berbeda dari password saat ini." error={fieldErrors.newPassword}>
            <Input value={next} onChangeText={setNext} secureTextEntry autoComplete="new-password" invalid={Boolean(fieldErrors.newPassword)} accessibilityLabel="Password baru" />
          </FormField>
          <FormField label="Ulangi password baru" error={fieldErrors.confirmPassword}>
            <Input value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" invalid={Boolean(fieldErrors.confirmPassword)} accessibilityLabel="Ulangi password baru" />
          </FormField>
          <AppText size={13} tone="mutedForeground">
            Perangkat lain akan otomatis keluar. Perangkat ini tetap masuk.
          </AppText>
          <Button
            label={change.isPending ? "Menyimpan…" : "Ganti password"}
            big
            disabled={change.isPending}
            onPress={() =>
              change.mutate(
                { currentPassword: current, newPassword: next, confirmPassword: confirm },
                {
                  onSuccess: async (result) => {
                    if (result.token) await replaceToken(result.token);
                    toast({ message: result.message, type: "success" });
                    close();
                  },
                },
              )
            }
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({ form: { gap: 20 } });
