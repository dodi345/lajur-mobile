import { Tabs } from "expo-router/js-tabs";
import { BottomNav } from "@/components/screen";

// Tab bar = nav bawah web Lajur (kapsul kaca melayang + tombol "+" di tengah), bukan tab bawaan Android.
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <BottomNav {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
