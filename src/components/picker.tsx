import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Glass } from "@/components/glass";
import { Icon } from "@/components/icon";
import { AppText } from "@/components/ui";
import { RADIUS, useTheme } from "@/lib/theme";

// Pemilih satu nilai (filter Transaksi). Di web ini <select> bawaan browser; di app tampil sebagai
// lembar kaca dari bawah dengan gaya sheet web (sudut 20px, pegangan, daftar baris 48px).

export type PickerOption<T> = { value: T; label: string };

export function OptionPicker<T>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: PickerOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Tutup" style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]} onPress={onClose} />
        <Glass borderless={["bottom"]} style={[styles.panel, { maxHeight: height * 0.7, paddingBottom: insets.bottom + 8 }]}>
          <View style={styles.grab}>
            <View style={[styles.handle, { backgroundColor: theme.handle }]} />
          </View>
          <AppText size={13} weight={500} tone="mutedForeground" style={styles.title}>
            {title}
          </AppText>
          <ScrollView>
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    onSelect(option.value);
                    onClose();
                  }}
                  style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.pressedRow }]}
                >
                  <AppText weight={selected ? 600 : 400} tone={selected ? "primary" : "foreground"} style={styles.flex} numberOfLines={1}>
                    {option.label}
                  </AppText>
                  {selected ? <Icon name="CheckCircle" size={20} filled color={theme.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Glass>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  panel: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet },
  grab: { height: 24, alignItems: "center", paddingTop: 8 },
  handle: { width: 40, height: 6, borderRadius: RADIUS.full },
  title: { paddingHorizontal: 16, paddingBottom: 4 },
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  flex: { flex: 1 },
});
