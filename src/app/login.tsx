import { router } from "expo-router";
import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { AuthShell, Checkbox } from "@/components/auth-shell";
import { AppText, Button, FormField, FormMessage, Input, TextLink } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { authErrorMessage, useAuth } from "@/lib/auth";

// Masuk = /login web (components/auth/auth-forms.tsx).
export default function LoginScreen() {
  const { signIn } = useAuth();
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
            <TextLink label="Lupa password?" onPress={() => void Linking.openURL(`${API_URL}/forgot-password`)} />
          </View>
          <AppText size={13} tone="mutedForeground">
            Matikan di perangkat bersama: kamu otomatis keluar paling lama 24 jam.
          </AppText>
        </View>
        <Button label={busy ? "Memproses…" : "Masuk"} big onPress={() => void submit()} disabled={busy} style={styles.submit} />
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
});
