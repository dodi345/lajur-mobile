import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { categoryIcon } from "@/components/finance";
import { Icon } from "@/components/icon";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ErrorState, FormField, FormMessage, IconChip, Input, Loading, Segmented } from "@/components/ui";
import { ApiError, type ManagedCategory } from "@/lib/api";
import { useCreateCategory, useManagedCategories } from "@/lib/queries";
import { RADIUS, TOUCH, useTheme } from "@/lib/theme";

// Kategori (US-11) = app/(app)/categories/page.tsx web: tab Pengeluaran/Pemasukan, daftar + jumlah pemakaian,
// tambah kategori, kategori diarsipkan (dilipat). Kategori tidak dihapus, hanya diarsipkan (BR-09).

type Kind = "expense" | "income";
const KINDS = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
] as const;

export default function CategoriesScreen() {
  const theme = useTheme();
  const [kind, setKind] = useState<Kind>("expense");
  const [archivedOpen, setArchivedOpen] = useState(false);
  const query = useManagedCategories(kind);
  const active = query.data?.active ?? [];
  const archived = query.data?.archived ?? [];

  return (
    <Page title="Kategori" back={() => router.back()} gap={20} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Segmented options={KINDS} value={kind} onChange={setKind} />
      {query.isPending ? (
        <Loading label="Memuat kategori…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          {active.length === 0 ? (
            <AppText size={14} lineHeight={20} tone="mutedForeground">
              Belum ada kategori aktif.
            </AppText>
          ) : (
            <View>
              {active.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </View>
          )}

          <AddCategoryForm key={kind} kind={kind} />

          {archived.length > 0 ? (
            <View style={[styles.archived, { borderColor: theme.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: archivedOpen }}
                onPress={() => setArchivedOpen((open) => !open)}
                style={styles.archivedHead}
              >
                <AppText size={14} weight={500} lineHeight={20}>
                  Diarsipkan ({archived.length})
                </AppText>
                <View style={archivedOpen && styles.rotated}>
                  <Icon name="ChevronRight" size={20} color={theme.foreground} />
                </View>
              </Pressable>
              {archivedOpen ? (
                <View style={[styles.archivedBody, { borderTopColor: theme.border }]}>
                  {archived.map((category) => (
                    <CategoryRow key={category.id} category={category} muted />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <AppText size={13} tone="mutedForeground">
            Kategori yang sudah dipakai tidak bisa dihapus, hanya diarsipkan, agar ringkasan bulan lalu tetap benar.
          </AppText>
        </>
      )}
    </Page>
  );
}

function CategoryRow({ category, muted }: { category: ManagedCategory; muted?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/category/${category.id}`)}
      style={({ pressed }) => [styles.row, muted && styles.muted, pressed && { backgroundColor: theme.muted }]}
    >
      <IconChip name={categoryIcon(category.icon)} />
      <AppText weight={500} numberOfLines={1} style={styles.flex}>
        {category.name}
      </AppText>
      <AppText size={13} tone="mutedForeground" numeric>
        {category.usageCount} transaksi
      </AppText>
      <Icon name="ChevronRight" size={20} color={theme.mutedForeground} />
    </Pressable>
  );
}

/** Tambah kategori untuk tab yang dibuka. Berhasil → toast, isian kosong lagi (key di pemanggil per tab). */
function AddCategoryForm({ kind }: { kind: Kind }) {
  const toast = useToast();
  const create = useCreateCategory();
  const [name, setName] = useState("");
  const fieldErrors = (create.error instanceof ApiError ? create.error.fieldErrors : undefined) ?? {};
  const submit = () =>
    create.mutate(
      { name: name.trim(), kind },
      {
        onSuccess: (result) => {
          toast({ message: result.message, type: "success" });
          setName("");
        },
      },
    );
  return (
    <View style={styles.addForm}>
      {create.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={create.error.message} /> : null}
      <FormField label={`Kategori ${kind === "expense" ? "pengeluaran" : "pemasukan"} baru`} error={fieldErrors.name}>
        <View style={styles.addRow}>
          <View style={styles.flex}>
            <Input
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholder={kind === "expense" ? "mis. Ngopi" : "mis. Freelance"}
              invalid={Boolean(fieldErrors.name)}
              onSubmitEditing={submit}
              returnKeyType="done"
              style={styles.addInput}
              accessibilityLabel={`Kategori ${kind === "expense" ? "pengeluaran" : "pemasukan"} baru`}
            />
          </View>
          <Button label={create.isPending ? "Menyimpan…" : "Tambah"} onPress={submit} disabled={create.isPending} style={styles.addButton} />
        </View>
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderRadius: RADIUS.xl, paddingHorizontal: 8, paddingVertical: 8 },
  muted: { opacity: 0.7 },
  addForm: { gap: 12 },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: { height: TOUCH },
  addButton: { paddingHorizontal: 20 },
  archived: { borderWidth: 1, borderRadius: RADIUS.xl },
  archivedHead: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  rotated: { transform: [{ rotate: "90deg" }] },
  archivedBody: { borderTopWidth: 1, padding: 8 },
});
