import { useState } from "react";
import { FormScreen } from "@/components/screen";
import { AppText, Button, TextField } from "@/components/ui";
import { authErrorMessage, useAuth } from "@/lib/auth";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Isi nama dan email.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
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
    <FormScreen>
      <AppText variant="title">Daftar akun</AppText>
      <AppText tone="muted">Kategori pengeluaran dan pemasukan dasar langsung disiapkan.</AppText>
      <TextField label="Nama" value={name} onChangeText={setName} autoComplete="name" textContentType="name" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint="Minimal 8 karakter."
      />
      {error && (
        <AppText tone="destructive" accessibilityRole="alert">
          {error}
        </AppText>
      )}
      <Button label="Daftar" onPress={submit} loading={busy} />
    </FormScreen>
  );
}
