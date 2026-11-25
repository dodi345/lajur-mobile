import Constants from "expo-constants";
import { Linking, StyleSheet, View } from "react-native";
import { FormScreen } from "@/components/screen";
import { AppText, Button, Card } from "@/components/ui";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/lib/auth";

// Akun: data singkat + Keluar. Fitur lain (target, utang-piutang, kategori, bot Telegram) ada di web.
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  return (
    <FormScreen>
      <Card>
        <AppText variant="heading">{user?.name}</AppText>
        <AppText tone="muted">{user?.email}</AppText>
        {user && !user.emailVerified && (
          <AppText variant="label" tone="warning">
            Email belum dikonfirmasi. Cek kotak masuk untuk tautan konfirmasi.
          </AppText>
        )}
      </Card>
      <Card>
        <AppText>
          Target tabungan, utang & piutang, kategori, ekspor CSV, dan bot Telegram tersedia di Lajur versi web.
        </AppText>
        <Button label="Buka Lajur di browser" variant="secondary" icon="open_in_new" onPress={() => void Linking.openURL(API_URL)} />
      </Card>
      <Button label="Keluar" variant="destructive" icon="logout" onPress={() => void signOut()} />
      <View style={styles.version}>
        <AppText variant="label" tone="muted">
          Lajur untuk Android · versi {Constants.expoConfig?.version ?? "-"}
        </AppText>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  version: { alignItems: "center", paddingTop: 8 },
});
