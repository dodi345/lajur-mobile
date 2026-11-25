import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { Glass } from "@/components/glass";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Toast = sonner di web Lajur (components/toaster.tsx): di atas tengah (16px dari atas + inset),
// kaca, sudut 21,6px, px-4 py-3, teks 14 (font sistem, seperti web), tombol aksi "Batal" bergaris bawah.
// Durasi 6 detik, 8 detik kalau ada tombol aksi. Ikon hanya untuk toast bertipe (sonner).

type ToastType = "default" | "success" | "warning" | "error";
type ToastInput = { message: string; description?: string; type?: ToastType; actionLabel?: string; onAction?: () => void };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

const ICONS: Record<Exclude<ToastType, "default">, { viewBox: string; d: string }> = {
  success: {
    viewBox: "0 0 20 20",
    d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z",
  },
  warning: {
    viewBox: "0 0 24 24",
    d: "M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z",
  },
  error: {
    viewBox: "0 0 20 20",
    d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [appear] = useState(() => new Animated.Value(0));
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(appear, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setToast(null));
  }, [appear]);

  const show = useCallback(
    (next: ToastInput) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(next);
      appear.setValue(0);
      Animated.timing(appear, { toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      timer.current = setTimeout(hide, next.actionLabel ? 8_000 : 6_000);
    },
    [appear, hide],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const iconColor = toast?.type === "success" ? theme.income : toast?.type === "warning" ? theme.warning : theme.destructive;
  const icon = toast?.type && toast.type !== "default" ? ICONS[toast.type] : null;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            {
              top: insets.top + 16,
              opacity: appear,
              transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
            },
          ]}
        >
          <Glass style={styles.toast}>
            <View style={styles.row} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {icon && (
                <Svg width={20} height={20} viewBox={icon.viewBox}>
                  <Path d={icon.d} fill={iconColor} fillRule="evenodd" clipRule="evenodd" />
                </Svg>
              )}
              <View style={styles.text}>
                <Text style={[styles.title, { color: theme.foreground }]}>{toast.message}</Text>
                {toast.description ? (
                  <Text style={[styles.description, { color: theme.mutedForeground }]}>{toast.description}</Text>
                ) : null}
              </View>
              {toast.actionLabel && toast.onAction ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    if (timer.current) clearTimeout(timer.current);
                    hide();
                    toast.onAction?.();
                  }}
                  style={styles.action}
                >
                  <Text style={[styles.actionLabel, { color: theme.primary }]}>{toast.actionLabel}</Text>
                </Pressable>
              ) : null}
            </View>
          </Glass>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast di luar ToastProvider");
  return show;
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16 },
  toast: { borderRadius: RADIUS.xl2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  description: { fontSize: 13, lineHeight: 19.5 },
  action: { minHeight: TOUCH, paddingHorizontal: 12, justifyContent: "center", borderRadius: RADIUS.lg, marginVertical: -8 },
  actionLabel: { fontSize: 14, lineHeight: 20, fontWeight: "600", textDecorationLine: "underline" },
});
