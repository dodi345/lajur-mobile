import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthShell, Checkbox } from "@/components/auth-shell";
import { AppText, Button, FormField, FormMessage, Input, TextLink } from "@/components/ui";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

// Masuk = /login web (components/auth/auth-forms.tsx).
export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, signInDemo } = useAuth();
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Isi email dan password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password, remember);
    } catch (caught) {
      setError(authErrorMessage(caught));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Masuk"
      subtitle="Lanjutkan mencatat keuanganmu."
      footer={
        <View style={styles.footer}>
          <AppText size={14} lineHeight={20} tone="mutedForeground">
            Belum punya akun?
          </AppText>
          <TextLink label="Daftar" onPress={() => router.push("/register")} />
        </View>
      }
    >
      <View style={styles.form}>
        {error ? <FormMessage message={error} /> : null}
        <FormField label="Email">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            accessibilityLabel="Email"
          />
        </FormField>
        <FormField label="Password">
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Password kamu"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            accessibilityLabel="Password"
            onSubmitEditing={() => void submit()}
          />
        </FormField>
        <View style={styles.remember}>
          <View style={styles.rememberRow}>
            <Checkbox checked={remember} onChange={setRemember} label="Ingat saya" />
            <TextLink label="Lupa password?" onPress={() => router.push("/forgot-password")} />
          </View>
          <AppText size={13} tone="mutedForeground">
            Matikan di perangkat bersama: kamu otomatis keluar paling lama 24 jam.
          </AppText>
        </View>
        <Button label={busy ? "Memproses…" : "Masuk"} big onPress={() => void submit()} disabled={busy || demoBusy} style={styles.submit} />
      </View>
      {/* Akun demo untuk pengunjung: satu tombol, tanpa email/password (sama dengan web). */}
      <View style={styles.demo}>
        <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.line, { backgroundColor: theme.border }]} />
          <AppText size={13} tone="mutedForeground">
            atau
          </AppText>
          <View style={[styles.line, { backgroundColor: theme.border }]} />
        </View>
        {demoError ? <FormMessage message={demoError} /> : null}
        <Button
          label={demoBusy ? "Menyiapkan data contoh…" : "Coba akun demo"}
          variant="outline"
          big
          disabled={busy || demoBusy}
          onPress={() => {
            setDemoBusy(true);
            setDemoError(null);
            signInDemo().catch((caught: unknown) => {
              setDemoError(caught instanceof Error && caught.message ? caught.message : "Akun demo sedang disiapkan. Coba tekan lagi.");
              setDemoBusy(false);
            });
          }}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  remember: { marginTop: -8, gap: 4 },
  rememberRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  submit: { marginTop: 8 },
  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
  demo: { gap: 12 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: 1 },
});
