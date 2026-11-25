import { NativeTabs } from "expo-router/native-tabs";
import { useTheme } from "@/lib/theme";

// Tab bar native Android (Material). Ikon: Material Symbols.
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <NativeTabs
      backgroundColor={theme.background}
      indicatorColor={`${theme.primary}26`}
      iconColor={{ default: theme.textMuted, selected: theme.primary }}
      labelStyle={{ default: { color: theme.textMuted }, selected: { color: theme.primary } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Beranda</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Label>Transaksi</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallets">
        <NativeTabs.Trigger.Label>Dompet</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="account_balance_wallet" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="summary">
        <NativeTabs.Trigger.Label>Ringkasan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="pie_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
