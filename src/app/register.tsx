import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AuthShell } from "@/components/auth-shell";
import { AppText, Button, FormField, FormMessage, Input, TextLink } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { authErrorMessage, useAuth } from "@/lib/auth";
import { useSignUpStatus } from "@/lib/queries";
import { registerErrors } from "@/lib/validation";

// Daftar = /register web: aturan dan pesan per kolom sama dengan web (dicek di HP, server memeriksa ulang).
// Pendaftaran ditutup (DISABLE_SIGNUP) → "Pendaftaran ditutup" + tombol ke halaman Masuk.
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ReturnType<typeof registerErrors>>({});
  const [busy, setBusy] = useState(false);
  const signUpOpen = useSignUpStatus().data !== false;

  const submit = async () => {
    const errors = registerErrors({ name, email, password });
    setFieldErrors(errors);
    setError(null);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    try {
      await signUp(name, email, password);
    } catch (caught) {
      // Email sudah terdaftar tampil di bawah kolom email, sama dengan web.
      if (caught instanceof ApiError && (caught.code ?? "").startsWith("USER_ALREADY_EXISTS")) {
        setFieldErrors({ email: "Email ini sudah terdaftar. Silakan masuk." });
      } else {
        setError(authErrorMessage(caught));
      }
      setBusy(false);
    }
  };

  if (!signUpOpen) {
    return (
      <AuthShell
        title="Pendaftaran ditutup"
        subtitle="Saat ini Lajur belum menerima akun baru. Kamu tetap bisa mencoba akun demo di halaman Masuk."
        footer={null}
      >
        <Button label="Ke halaman Masuk" big onPress={() => (router.canGoBack() ? router.back() : router.replace("/login"))} />
      </AuthShell>
    );
  }

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
        <FormField label="Nama" error={fieldErrors.name}>
          <Input value={name} onChangeText={setName} placeholder="Nama kamu" autoComplete="name" invalid={Boolean(fieldErrors.name)} accessibilityLabel="Nama" />
        </FormField>
        <FormField label="Email" error={fieldErrors.email}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="nama@email.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            invalid={Boolean(fieldErrors.email)}
            accessibilityLabel="Email"
          />
        </FormField>
        <FormField label="Password" hint="Minimal 8 karakter." error={fieldErrors.password}>
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Buat password"
            secureTextEntry
            autoComplete="new-password"
            invalid={Boolean(fieldErrors.password)}
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
