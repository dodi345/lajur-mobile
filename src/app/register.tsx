import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthShell } from "@/components/auth-shell";
import { AppText, Button, FormField, FormMessage, Input, TextLink } from "@/components/ui";
import { authErrorMessage, useAuth } from "@/lib/auth";

// Daftar = /register web. Validasi akhir di server (Better Auth); pesan dalam bahasa Indonesia.
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError("Isi nama, email, dan password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signUp(name, email, password);
    } catch (caught) {
      setError(authErrorMessage(caught));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Buat akun"
      subtitle="Datamu hanya bisa dilihat oleh akunmu sendiri."
      footer={
        <View style={styles.footer}>
          <AppText size={14} lineHeight={20} tone="mutedForeground">
            Sudah punya akun?
          </AppText>
          <TextLink label="Masuk" onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))} />
        </View>
      }
    >
      <View style={styles.form}>
        {error ? <FormMessage message={error} /> : null}
        <FormField label="Nama">
          <Input value={name} onChangeText={setName} placeholder="Nama kamu" autoComplete="name" accessibilityLabel="Nama" />
        </FormField>
        <FormField label="Email">
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            accessibilityLabel="Email"
          />
        </FormField>
        <FormField label="Password" hint="Minimal 8 karakter.">
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Buat password"
            secureTextEntry
            autoComplete="new-password"
            accessibilityLabel="Password"
          />
        </FormField>
        <Button label={busy ? "Membuat akun…" : "Daftar"} big onPress={() => void submit()} disabled={busy} style={styles.submit} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  submit: { marginTop: 8 },
  footer: { flexDirection: "row", alignItems: "center", gap: 4 },
});
