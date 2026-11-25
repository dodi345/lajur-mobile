import { Stack } from "expo-router";

// Halaman setelah login. Tab (Beranda, Transaksi, Target, Akun) di bawah; Dompet, Ringkasan, dan detail
// dompet/target didorong di atasnya (header sendiri seperti web). Form tampil sebagai bottom sheet
// (transparentModal; animasi geser-naik dibuat sendiri di components/sheet.tsx).
export const unstable_settings = { anchor: "(tabs)" };

const SHEET = { presentation: "transparentModal", animation: "none", contentStyle: { backgroundColor: "transparent" } } as const;

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wallets" />
      <Stack.Screen name="wallet/[id]" />
      <Stack.Screen name="goal/[id]/index" />
      <Stack.Screen name="debts" />
      <Stack.Screen name="debt/[id]/index" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="category/[id]" />
      <Stack.Screen name="trash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="transaction/new" options={SHEET} />
      <Stack.Screen name="transaction/[id]" options={SHEET} />
      <Stack.Screen name="wallet/new" options={SHEET} />
      <Stack.Screen name="goal/new" options={SHEET} />
      <Stack.Screen name="goal/[id]/deposit" options={SHEET} />
      <Stack.Screen name="debt/new" options={SHEET} />
      <Stack.Screen name="debt/[id]/pay" options={SHEET} />
      <Stack.Screen name="sessions" />
      <Stack.Screen name="profile/email" options={SHEET} />
      <Stack.Screen name="profile/password" options={SHEET} />
      <Stack.Screen name="profile/delete" options={SHEET} />
    </Stack>
  );
}
