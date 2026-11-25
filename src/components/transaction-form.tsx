import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";
import { categoryIcon } from "@/components/finance";
import { Icon } from "@/components/icon";
import { AppText, Button, ChoiceChip, FormField, FormMessage, IconChip, Input, MoneyInput, Segmented } from "@/components/ui";
import { WalletLogo } from "@/components/wallet-logo";
import { useToast } from "@/components/toast";
import { ApiError, type Category, type Transaction, type TransactionInput, type Wallet } from "@/lib/api";
import { displayDate, shiftDay } from "@/lib/date";
import { formatAmountInput, formatRupiah, groupThousands, parseAmountInput } from "@/lib/money";
import { useCategories, useDeleteTransaction, useSaveTransaction, useWallets } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Form catat/ubah transaksi = web (components/transactions/transaction-form.tsx). Validasi akhir di
// server (skema Zod yang sama); pesan per field dari server tampil di bawah isiannya.

type EntryType = TransactionInput["type"];

const TYPE_OPTIONS = [
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
] as const;

/** Kategori: 5 yang paling sering dipakai + "Lainnya…" (kalau lebih dari 6), sama dengan web. */
const TOP_CATEGORIES = 5;

function Legend({ children }: { children: string }) {
  return (
    <AppText size={13} weight={500} tone="mutedForeground" style={styles.legend}>
      {children}
    </AppText>
  );
}

/**
 * Simpan transaksi baru seperti web: toast "Transaksi tersimpan." + "Batal" (menghapus lagi, BR-10);
 * saldo jadi minus → toast peringatan dengan keterangan (BR-07). Dipakai "Catat transaksi" dan "Tabung ke target".
 */
export function useRecordTransaction() {
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const toast = useToast();
  const fieldErrors = (save.error instanceof ApiError ? save.error.fieldErrors : undefined) ?? {};
  const record = (input: TransactionInput, onSaved: () => void) =>
    save.mutate(input, {
      onSuccess: (result) => {
        const undo = () =>
          remove.mutate(result.id, {
            onSuccess: () => toast({ message: "Transaksi dibatalkan" }),
            onError: () => toast({ message: "Transaksi tidak bisa dibatalkan.", type: "error" }),
          });
        toast({
          message: "Transaksi tersimpan.",
          type: result.warning ? "warning" : "default",
          description: result.warning,
          actionLabel: "Batal",
          onAction: undo,
        });
        onSaved();
      },
    });
  return {
    record,
    submitting: save.isPending,
    fieldErrors,
    message: save.error && Object.keys(fieldErrors).length === 0 ? save.error.message : null,
  };
}

export function TransactionForm({
  initial,
  preset,
  today,
  submitting,
  fieldErrors,
  message,
  submitLabel,
  onSubmit,
}: {
  initial?: Transaction;
  /** Isian awal form baru, mis. "Tabung ke target" = Transfer ke dompet tabungan target (BR-08). */
  preset?: { type: EntryType; walletId: number | null; toWalletId: number | null };
  /** Hari ini menurut zona waktu user (dari server). */
  today: string | undefined;
  submitting: boolean;
  fieldErrors: Record<string, string>;
  message: string | null;
  submitLabel: string;
  onSubmit: (input: TransactionInput) => void;
}) {
  const wallets = useWallets();
  const [type, setType] = useState<EntryType>(initial && initial.type !== "adjustment" ? initial.type : (preset?.type ?? "expense"));
  const [amount, setAmount] = useState(initial ? groupThousands(initial.amount) : "");
  const [walletId, setWalletId] = useState<number | null>(
    initial ? (initial.type === "income" ? initial.toWalletId : initial.fromWalletId) : (preset?.walletId ?? null),
  );
  const [toWalletId, setToWalletId] = useState<number | null>(
    initial ? (initial.type === "transfer" ? initial.toWalletId : null) : (preset?.toWalletId ?? null),
  );
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null);
  const [date, setDate] = useState<string | null>(initial?.transactionDate ?? null);
  const [noteOpen, setNoteOpen] = useState(Boolean(initial?.note));
  const [note, setNote] = useState(initial?.note ?? "");
  const [showAll, setShowAll] = useState(false);
  const categories = useCategories(type === "income" ? "income" : "expense");

  const walletList = wallets.data ?? [];
  const selectedWallet = walletId ?? (initial ? null : (walletList[0]?.id ?? null));
  const selectedDate = date ?? today ?? null;
  const yesterday = today ? shiftDay(today, -1) : null;

  const pickDate = () => {
    if (Platform.OS !== "android") return;
    const [y, m, d] = (selectedDate ?? "2026-01-01").split("-").map(Number);
    const [ty, tm, td] = (today ?? "2100-12-31").split("-").map(Number);
    DateTimePickerAndroid.open({
      value: new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1),
      mode: "date",
      maximumDate: new Date(ty ?? 2100, (tm ?? 12) - 1, td ?? 31),
      onChange: (event, value) => {
        if (event.type !== "set" || !value) return;
        const pad = (n: number) => String(n).padStart(2, "0");
        setDate(`${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`);
      },
    });
  };

  const submit = () =>
    onSubmit({
      type,
      amount: parseAmountInput(amount),
      walletId: selectedWallet,
      toWalletId: type === "transfer" ? toWalletId : null,
      categoryId: type === "transfer" ? null : categoryId,
      transactionDate: selectedDate ?? "",
      note: note.trim(),
    });

  return (
    <View style={styles.form}>
      {message ? <FormMessage message={message} /> : null}
      <Segmented
        options={TYPE_OPTIONS}
        value={type}
        onChange={(next) => {
          setType(next);
          setCategoryId(null);
          setShowAll(false);
        }}
      />

      <FormField label="Nominal" error={fieldErrors.amount}>
        <MoneyInput
          value={amount}
          onChangeText={(text) => setAmount(formatAmountInput(text))}
          invalid={Boolean(fieldErrors.amount)}
          autoFocus={!initial}
          accessibilityLabel="Nominal"
        />
      </FormField>

      {type !== "transfer" && (
        <View>
          <Legend>Kategori</Legend>
          <CategoryGrid
            categories={categories.data ?? []}
            selected={categoryId}
            onSelect={setCategoryId}
            showAll={showAll}
            onShowAll={() => setShowAll(true)}
          />
          {fieldErrors.categoryId ? (
            <AppText size={13} tone="destructive" style={styles.errorBelow}>
              {fieldErrors.categoryId}
            </AppText>
          ) : null}
        </View>
      )}

      <View>
        <Legend>{type === "income" ? "Masuk ke dompet" : "Dari dompet"}</Legend>
        <WalletPicker wallets={walletList} selected={selectedWallet} onSelect={setWalletId} />
        {fieldErrors.walletId ? (
          <AppText size={13} tone="destructive" style={styles.errorBelow}>
            {fieldErrors.walletId}
          </AppText>
        ) : null}
        {wallets.isSuccess && walletList.length === 0 ? (
          <AppText size={13} tone="mutedForeground">
            Belum ada dompet. Tambahkan dompet dulu dari Beranda → Dompet.
          </AppText>
        ) : null}
      </View>

      {type === "transfer" && (
        <>
          <View>
            <Legend>Ke dompet</Legend>
            <WalletPicker
              wallets={walletList.filter((wallet) => wallet.id !== selectedWallet)}
              selected={toWalletId}
              onSelect={setToWalletId}
            />
            {fieldErrors.toWalletId ? (
              <AppText size={13} tone="destructive" style={styles.errorBelow}>
                {fieldErrors.toWalletId}
              </AppText>
            ) : null}
          </View>
          <AppText size={13} tone="mutedForeground" style={styles.transferNote}>
            Transfer tidak dihitung sebagai pengeluaran maupun pemasukan.
          </AppText>
        </>
      )}

      <View>
        <Legend>Tanggal</Legend>
        <View style={styles.dateRow}>
          <ChoiceChip label="Hari ini" selected={selectedDate === today} onPress={() => setDate(today ?? null)} style={styles.dateChip} />
          {yesterday ? (
            <ChoiceChip label="Kemarin" selected={selectedDate === yesterday} onPress={() => setDate(yesterday)} style={styles.dateChip} />
          ) : null}
          <ChoiceChip
            label={selectedDate ? displayDate(selectedDate) : "Pilih tanggal"}
            accessibilityLabel="Pilih tanggal lain"
            selected={selectedDate !== null && selectedDate !== today && selectedDate !== yesterday}
            onPress={pickDate}
            style={styles.dateChip}
          />
        </View>
        {fieldErrors.transactionDate ? (
          <AppText size={13} tone="destructive" style={styles.errorBelow}>
            {fieldErrors.transactionDate}
          </AppText>
        ) : null}
      </View>

      {noteOpen ? (
        <FormField label="Catatan" error={fieldErrors.note}>
          <Input value={note} onChangeText={setNote} placeholder="mis. Makan siang" maxLength={255} accessibilityLabel="Catatan" />
        </FormField>
      ) : (
        <NoteButton onPress={() => setNoteOpen(true)} />
      )}

      <Button label={submitting ? "Menyimpan…" : submitLabel} big onPress={submit} disabled={submitting} style={styles.submit} />
    </View>
  );
}

function NoteButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.noteButton, pressed && { opacity: 0.7 }]}>
      <Icon name="Note" size={20} color={theme.primary} />
      <AppText size={14} weight={500} lineHeight={20} tone="primary">
        Tambah catatan
      </AppText>
    </Pressable>
  );
}

function CategoryGrid({
  categories,
  selected,
  onSelect,
  showAll,
  onShowAll,
}: {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number) => void;
  showAll: boolean;
  onShowAll: () => void;
}) {
  const theme = useTheme();
  const selectedHidden = selected !== null && categories.findIndex((category) => category.id === selected) >= TOP_CATEGORIES;
  const collapsed = !showAll && !selectedHidden && categories.length > TOP_CATEGORIES + 1;
  const visible = collapsed ? categories.slice(0, TOP_CATEGORIES) : categories;
  return (
    <View style={styles.grid}>
      {visible.map((category) => {
        const active = category.id === selected;
        return (
          <View key={category.id} style={styles.cell}>
            <ChoiceChip selected={active} onPress={() => onSelect(category.id)} accessibilityLabel={category.name} style={styles.categoryTile}>
              <IconChip name={categoryIcon(category.icon)} size={32} />
              <AppText size={13} weight={500} numberOfLines={1} style={{ color: active ? theme.primary : theme.foreground }}>
                {category.name}
              </AppText>
            </ChoiceChip>
          </View>
        );
      })}
      {collapsed ? (
        <View style={styles.cell}>
          <ChoiceChip selected={false} onPress={onShowAll} accessibilityLabel="Tampilkan semua kategori" style={styles.categoryTile}>
            <AppText size={13} tone="mutedForeground">
              Lainnya…
            </AppText>
          </ChoiceChip>
        </View>
      ) : null}
    </View>
  );
}

function WalletPicker({ wallets, selected, onSelect }: { wallets: Wallet[]; selected: number | null; onSelect: (id: number) => void }) {
  // Dompet terpilih saat form dibuka bisa berada di luar layar (mis. dompet tabungan di ujung kanan pada
  // "Tabung ke target"): geser barisnya agar pilihan itu terlihat, sama dengan web. Hanya sekali saat tampil.
  const scroller = useRef<ScrollViewInstance>(null);
  const [initial] = useState(selected);
  const layout = useRef<{ viewport?: number; chip?: { x: number; width: number }; done: boolean }>({ done: false });
  const reveal = () => {
    const { viewport, chip, done } = layout.current;
    if (done || viewport === undefined || !chip) return;
    layout.current.done = true;
    const hiddenRight = chip.x + chip.width - viewport;
    if (hiddenRight > 0) scroller.current?.scrollTo({ x: hiddenRight + 16, animated: false });
  };
  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bleed}
      contentContainerStyle={styles.walletRow}
      onLayout={(event) => {
        layout.current.viewport = event.nativeEvent.layout.width;
        reveal();
      }}
    >
      {wallets.map((wallet) => (
        <ChoiceChip
          key={wallet.id}
          selected={wallet.id === selected}
          onLayout={
            wallet.id === initial && initial !== null
              ? (event) => {
                  const { x, width } = event.nativeEvent.layout;
                  layout.current.chip = { x, width };
                  reveal();
                }
              : undefined
          }
          onPress={() => onSelect(wallet.id)}
          accessibilityLabel={`${wallet.name}, saldo ${formatRupiah(wallet.balance)}`}
          style={styles.walletChip}
        >
          <WalletLogo type={wallet.type} brand={wallet.brand} />
          <View>
            {/* Nama disembunyikan kalau dompet punya logo merek (sama dengan web). */}
            {!wallet.brand ? (
              <AppText size={14} weight={500} lineHeight={20} numberOfLines={1} style={styles.walletName}>
                {wallet.name}
              </AppText>
            ) : null}
            <AppText size={12} tone={wallet.balance < 0 ? "warning" : "mutedForeground"} numeric>
              {formatRupiah(wallet.balance)}
            </AppText>
          </View>
        </ChoiceChip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  legend: { marginBottom: 8 },
  errorBelow: { marginTop: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, rowGap: 8 },
  cell: { width: "33.333%", paddingHorizontal: 4 },
  categoryTile: { minHeight: 64, flexDirection: "column", gap: 4, paddingHorizontal: 4, paddingVertical: 8 },
  bleed: { marginHorizontal: -16 },
  walletRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 4 },
  walletChip: { minHeight: 56, justifyContent: "flex-start", gap: 8, paddingVertical: 8, paddingLeft: 8, paddingRight: 16 },
  walletName: { maxWidth: 128 },
  transferNote: { marginTop: -8 },
  dateRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dateChip: { paddingHorizontal: 16 },
  noteButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 4,
  },
  submit: { marginTop: 4 },
});

