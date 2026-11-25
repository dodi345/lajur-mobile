import { Stack } from "expo-router";

// Layar modal (catat transaksi, tambah dompet) selalu punya tab di bawahnya, juga kalau dibuka langsung.
export const unstable_settings = { anchor: "(tabs)" };

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction/new" options={{ title: "Catat transaksi", presentation: "modal" }} />
      <Stack.Screen name="transaction/[id]" options={{ title: "Transaksi" }} />
      <Stack.Screen name="wallet/new" options={{ title: "Tambah dompet", presentation: "modal" }} />
      <Stack.Screen name="wallet/[id]" options={{ title: "Dompet" }} />
      <Stack.Screen name="profile" options={{ title: "Akun" }} />
    </Stack>
  );
}
