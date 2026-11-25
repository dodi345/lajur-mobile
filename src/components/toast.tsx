import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Toast di bawah layar, mis. "Transaksi dihapus · Batal" (BR-10: hapus tanpa dialog konfirmasi,
// cukup bisa dibatalkan). Hilang sendiri setelah 5 detik.

type ToastInput = { message: string; actionLabel?: string; onAction?: () => void; tone?: "info" | "warning" };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const show = useCallback((next: ToastInput) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(next);
    timer.current = setTimeout(() => setToast(null), next.tone === "warning" ? 8_000 : 5_000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + 88 }]}>
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.toast, { backgroundColor: theme.text }]}
          >
            <Text style={[styles.message, { color: theme.background }]}>{toast.message}</Text>
            {toast.actionLabel && toast.onAction && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setToast(null);
                  toast.onAction?.();
                }}
                style={styles.action}
              >
                <Text style={[styles.actionLabel, { color: theme.background }]}>{toast.actionLabel}</Text>
              </Pressable>
            )}
          </View>
        </View>
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
  wrap: { position: "absolute", left: 16, right: 16, alignItems: "center" },
  toast: {
    width: "100%",
    maxWidth: 480,
    borderRadius: RADIUS,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: TOUCH + 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  message: { flex: 1, fontSize: 15, paddingVertical: 8 },
  action: { minHeight: TOUCH, paddingHorizontal: 12, justifyContent: "center" },
  actionLabel: { fontSize: 15, fontWeight: "700", textTransform: "uppercase" },
});
