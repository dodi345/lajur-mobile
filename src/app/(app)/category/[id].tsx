import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { categoryIcon } from "@/components/finance";
import { Page } from "@/components/screen";
import { useToast } from "@/components/toast";
import { AppText, Button, ErrorState, FormField, FormMessage, IconChip, Input, Loading } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useCategory, useRenameCategory, useSetCategoryArchived } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Detail kategori = app/(app)/categories/[id]/page.tsx web: jenis + jumlah pemakaian, ubah nama, arsip/pulihkan (BR-09).
export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const query = useCategory(Number(id));
  const category = query.data;
  const archived = Boolean(category?.archivedAt);

  return (
    <Page title={category?.name ?? "Kategori"} back={() => router.back()} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? (
        <Loading label="Memuat kategori…" />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: theme.muted }]}>
            <IconChip name={categoryIcon(category!.icon)} />
            <View>
              <AppText size={14} lineHeight={20} tone="mutedForeground">
                {category!.kind === "expense" ? "Pengeluaran" : "Pemasukan"}
                {archived ? " · Diarsipkan" : ""}
              </AppText>
              <AppText size={14} lineHeight={20}>
                Dipakai di {category!.usageCount} transaksi
              </AppText>
            </View>
          </View>

          <View style={styles.section}>
            <AppText weight={600} accessibilityRole="header">
              Ubah nama
            </AppText>
            <RenameForm key={category!.name} categoryId={category!.id} name={category!.name} />
          </View>

          <View style={[styles.section, styles.divided, { borderTopColor: theme.border }]}>
            <AppText weight={600} accessibilityRole="header">
              {archived ? "Pulihkan kategori" : "Arsipkan kategori"}
            </AppText>
            <AppText size={13} tone="mutedForeground">
              {archived
                ? "Kategori muncul lagi saat mencatat transaksi."
                : "Kategori tidak muncul lagi saat mencatat transaksi. Transaksi lama tetap memakai kategori ini, dan bisa dipulihkan kapan saja."}
            </AppText>
            <ArchiveButton categoryId={category!.id} archived={archived} />
          </View>
        </>
      )}
    </Page>
  );
}

function RenameForm({ categoryId, name: current }: { categoryId: number; name: string }) {
  const toast = useToast();
  const save = useRenameCategory(categoryId);
  const [name, setName] = useState(current);
  const fieldErrors = (save.error instanceof ApiError ? save.error.fieldErrors : undefined) ?? {};
  return (
    <View style={styles.form}>
      {save.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={save.error.message} /> : null}
      <FormField label="Nama kategori" error={fieldErrors.name}>
        <Input value={name} onChangeText={setName} maxLength={50} invalid={Boolean(fieldErrors.name)} accessibilityLabel="Nama kategori" />
      </FormField>
      <Button
        label={save.isPending ? "Menyimpan…" : "Simpan nama"}
        variant="outline"
        disabled={save.isPending}
        onPress={() => save.mutate(name, { onSuccess: (result) => toast({ message: result.message, type: "success" }) })}
      />
    </View>
  );
}

/** Sama dengan web: tanpa toast, kembali ke daftar kategori. */
function ArchiveButton({ categoryId, archived }: { categoryId: number; archived: boolean }) {
  const toast = useToast();
  const change = useSetCategoryArchived(categoryId);
  const label = change.isPending ? (archived ? "Memulihkan…" : "Mengarsipkan…") : archived ? "Pulihkan" : "Arsipkan";
  return (
    <Button
      label={label}
      icon={archived ? "ArchiveArrowUp" : "Archive"}
      variant="outline"
      disabled={change.isPending}
      onPress={() =>
        change.mutate(!archived, {
          onSuccess: () => router.dismissTo("/categories"),
          onError: (error) => toast({ message: error.message, type: "error" }),
        })
      }
    />
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: RADIUS.xl, paddingHorizontal: 16, paddingVertical: 16 },
  section: { gap: 12 },
  divided: { borderTopWidth: 1, paddingTop: 24 },
  form: { gap: 12 },
});
