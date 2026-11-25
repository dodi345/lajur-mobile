import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthShell } from "@/components/auth-shell";
import { Icon } from "@/components/icon";
import { AppText, Button, FormField, Input, TextLink } from "@/components/ui";
import { ApiError, request } from "@/lib/api";
import { RADIUS, useTheme } from "@/lib/theme";

// Lupa password (US-29) = /forgot-password web. BR-27: jawaban selalu sama, terdaftar atau tidak.
// Tautan di email membuka halaman reset password Lajur di browser.
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await request<{ sent: true }>("/api/v1/auth/forgot-password", { method: "POST", body: { email: email.trim() } });
      setSent(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? (caught.fieldErrors?.email ?? caught.message) : "Terjadi kesalahan. Coba lagi sebentar lagi.");
    } finally {
      setBusy(false);
    }
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace("/login"));

  return (
    <AuthShell
      title="Lupa password"
      subtitle="Masukkan email akunmu. Kami kirim tautan untuk membuat password baru."
      footer={
        <View style={styles.footer}>
          <AppText size={14} lineHeight={20} tone="mutedForeground">
            Sudah ingat?
          </AppText>
          <TextLink label="Masuk" onPress={back} />
        </View>
      }
    >
      {sent ? (
        <View style={styles.form}>
          <View accessibilityRole="alert" style={[styles.sent, { borderColor: theme.border }]}>
            <View style={styles.sentIcon}>
              <Icon name="CheckCircle" size={20} color={theme.income} />
            </View>
            <AppText size={14} lineHeight={20} style={styles.flex}>
              Kalau email itu terdaftar, tautan untuk mengatur ulang password sudah dikirim. Tautan berlaku 1 jam.
            </AppText>
          </View>
          <AppText size={13} tone="mutedForeground">
            Belum masuk dalam beberapa menit? Cek folder spam atau promosi dulu sebelum meminta lagi. Permintaan dibatasi 3
            kali per jam.
          </AppText>
          <Button label="Kembali ke Masuk" variant="outline" onPress={back} />
        </View>
      ) : (
        <View style={styles.form}>
          <FormField label="Email" error={error}>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="nama@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              invalid={Boolean(error)}
              accessibilityLabel="Email"
              onSubmitEditing={() => void submit()}
            />
          </FormField>
          <Button label={busy ? "Mengirim…" : "Kirim tautan reset"} big disabled={busy} onPress={() => void submit()} style={styles.submit} />
        </View>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  form: { gap: 16 },
  submit: { marginTop: 8 },
  sent: { flexDirection: "row", gap: 12, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 12 },
  sentIcon: { marginTop: 2 },
  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
});
