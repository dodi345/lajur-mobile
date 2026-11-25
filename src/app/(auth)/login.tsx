import { Link } from "expo-router";
import { useState } from "react";
import { Image, Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormScreen } from "@/components/screen";
import { AppText, Button, TextField } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { authErrorMessage, useAuth } from "@/lib/auth";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await signIn(email, password);
    } catch (caught) {
      setError(authErrorMessage(caught));
      setBusy(false);
    }
  };

  return (
    <FormScreen>
      <View style={[styles.brand, { paddingTop: insets.top + 32 }]}>
        <Image source={require("@/assets/images/icon.png")} style={styles.logo} accessibilityIgnoresInvertColors />
        <AppText variant="title">Lajur</AppText>
        <AppText tone="muted">Catat uangmu: dompet, transaksi, dan ringkasan bulanan.</AppText>
      </View>
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
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={submit}
      />
      {error && (
        <AppText tone="destructive" accessibilityRole="alert">
          {error}
        </AppText>
      )}
      <Button label="Masuk" onPress={submit} loading={busy} />
      <Button
        label="Lupa password?"
        variant="ghost"
        onPress={() => void Linking.openURL(`${API_URL}/forgot-password`)}
      />
      <View style={styles.footer}>
        <AppText tone="muted">Belum punya akun?</AppText>
        <Link href="/register" style={styles.link}>
          <AppText tone="primary" variant="heading">
            Daftar
          </AppText>
        </Link>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", gap: 8, paddingBottom: 8 },
  logo: { width: 72, height: 72, borderRadius: 16 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  link: { paddingVertical: 12, paddingHorizontal: 4 },
});
