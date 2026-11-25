import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { usePreferences, useTheme } from "@/lib/theme";

// .glass di web: latar 85% + blur 24px + garis 1px. Dipakai HANYA di nav bawah, header ringkas, sheet,
// dan toast. "Kurangi efek kaca" (Akun → Tampilan) = latar muted padat tanpa blur, sama dengan web.

export function Glass({
  children,
  style,
  borderless,
}: {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Sisi tanpa garis (mis. sheet: tanpa garis bawah). */
  borderless?: ("top" | "bottom" | "left" | "right")[];
}) {
  const theme = useTheme();
  const { glassOff } = usePreferences();
  const border: ViewStyle = {
    borderColor: theme.glassBorder,
    borderTopWidth: borderless?.includes("top") ? 0 : 1,
    borderBottomWidth: borderless?.includes("bottom") ? 0 : 1,
    borderLeftWidth: borderless?.includes("left") ? 0 : 1,
    borderRightWidth: borderless?.includes("right") ? 0 : 1,
  };
  if (glassOff) {
    return <View style={[{ backgroundColor: theme.muted }, border, style]}>{children}</View>;
  }
  return (
    <View style={[styles.clip, border, style]}>
      <BlurView
        intensity={60}
        tint={theme.dark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassBg }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
});
