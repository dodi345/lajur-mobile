import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass } from "@/components/glass";
import { Icon } from "@/components/icon";
import { AppText } from "@/components/ui";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Bottom sheet web (components/ui/sheet.tsx + form-sheet.tsx): latar overlay, panel kaca sudut atas 20px,
// baris pegangan 48px (pil 6×40) + tombol tutup 44px, isi bergulir px-4 pb-6 gap-6, judul 22 bold.
// Tutup: tombol X, ketuk latar, tombol kembali, atau tarik pegangan > 96px.

export type SheetControls = { close: () => void };

export function Sheet({
  title,
  children,
  onClosed,
}: {
  title: string;
  children: (controls: SheetControls) => ReactNode;
  /** Dipanggil setelah animasi tutup (bawaan: kembali ke layar sebelumnya). */
  onClosed?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [translate] = useState(() => new Animated.Value(height));
  const [backdrop] = useState(() => new Animated.Value(0));
  const closing = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [translate, backdrop]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(translate, { toValue: height, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => (onClosed ? onClosed() : router.back()));
  }, [translate, backdrop, height, onClosed]);

  // PanResponder menyimpan state gestur di objeknya sendiri; aturan refs React Compiler salah membacanya
  // sebagai ref yang dibaca saat render.
  const pan = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 4,
        onPanResponderMove: (_, gesture) => translate.setValue(Math.max(gesture.dy, 0)),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 96) close();
          else Animated.spring(translate, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [translate, close],
  );

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay, opacity: backdrop }]}>
        <Pressable accessibilityLabel="Tutup" style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <KeyboardAvoidingView behavior="padding" style={styles.avoider} pointerEvents="box-none">
        <Animated.View style={[styles.panelWrap, { maxHeight: height - 32, transform: [{ translateY: translate }] }]}>
          <Glass borderless={["bottom"]} style={[styles.panel, { paddingBottom: insets.bottom }]}>
            <View style={styles.grabRow} {...pan.panHandlers}>
              <View style={[styles.handle, { backgroundColor: theme.handle }]} />
              <Pressable accessibilityRole="button" accessibilityLabel="Tutup" onPress={close} style={styles.close}>
                <Icon name="X" size={24} color={theme.foreground} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              <AppText size={22} weight={700} lineHeight={27.5} accessibilityRole="header">
                {title}
              </AppText>
              {/* `close` hanya membaca ref saat dipanggil (tombol/sukses simpan), bukan saat render. */}
              {/* eslint-disable-next-line react-hooks/refs */}
              {children({ close })}
            </ScrollView>
          </Glass>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  avoider: { flex: 1, justifyContent: "flex-end" },
  panelWrap: { width: "100%" },
  panel: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, flexShrink: 1 },
  grabRow: { height: 48, alignItems: "center", paddingTop: 8 },
  handle: { width: 40, height: 6, borderRadius: RADIUS.full },
  close: {
    position: "absolute",
    top: 6,
    right: 8,
    width: TOUCH,
    height: TOUCH,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 24 },
});
