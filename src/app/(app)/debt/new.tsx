import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { Legend, NoWallets, WalletPicker } from "@/components/transaction-form";
import { AppText, Button, DateField, ErrorState, FormField, FormMessage, Input, Loading, MoneyInput, Segmented } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { useDebts, useRecordDebt, useWallets } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Catat pinjaman (US-15 pinjamkan, US-16 pinjam, US-21 pinjaman lama) = components/debts/debt-form.tsx web.
// ?type=lend|borrow&name=… dari tombol "Pinjamkan lagi" / "Pinjam lagi" di detail pinjaman.

type Kind = "lend" | "borrow";
const KINDS = [
  { value: "lend", label: "Pinjamkan" },
  { value: "borrow", label: "Pinjam" },
] as const;

export default function NewDebtScreen() {
  const params = useLocalSearchParams<{ type?: string; name?: string }>();
  const theme = useTheme();
  const toast = useToast();
  const debts = useDebts();
  const wallets = useWallets();
  const record = useRecordDebt();
  const initialName = (params.name ?? "").slice(0, 40);
  const [kind, setKind] = useState<Kind>(params.type === "borrow" ? "borrow" : "lend");
  const [existing, setExisting] = useState(false);
  const [name, setName] = useState(initialName);
  const [nameFocused, setNameFocused] = useState(false);
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState<number | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState<string | null>(null);
  // ID pinjaman yang baru tersimpan; dibaca saat sheet selesai menutup.
  const saved = useRef<number | null>(null);
  const fieldErrors = (record.error instanceof ApiError ? record.error.fieldErrors : undefined) ?? {};
  const walletList = wallets.data ?? [];
  const today = debts.data?.today;
  const selectedWallet = walletId ?? walletList[0]?.id ?? null;
  const transactionDate = date ?? today ?? null;

  // Saran nama orang yang pernah dicatat (datalist web), supaya tidak dobel tak sengaja.
  const typed = name.trim().toLowerCase();
  const suggestions = nameFocused
    ? (debts.data?.counterparties ?? []).filter((item) => item.toLowerCase() !== typed && item.toLowerCase().includes(typed)).slice(0, 5)
    : [];

  const submit = (close: () => void) =>
    record.mutate(
      {
        kind,
        existing,
        counterparty: name.trim(),
        amount: parseAmountInput(amount),
        walletId: existing ? null : selectedWallet,
        transactionDate: transactionDate ?? "",
        dueDate,
        note: note.trim(),
      },
      {
        onSuccess: (result) => {
          toast({ message: result.message, type: "success" });
          saved.current = result.id;
          close();
        },
      },
    );

  return (
    // Tersimpan → ke detail pinjaman orang itu (web: redirectTo /debts/[id]); kalau detailnya sudah terbuka di
    // bawah sheet ("Pinjamkan lagi"), kembali ke sana.
    <Sheet title="Catat pinjaman" onClosed={() => (saved.current ? router.dismissTo(`/debt/${saved.current}`) : router.back())}>
      {({ close }) =>
        debts.isPending || wallets.isPending ? (
          <Loading />
        ) : debts.isError ? (
          <ErrorState message={debts.error.message} onRetry={() => void debts.refetch()} />
        ) : (
          <View style={styles.form}>
            {record.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={record.error.message} /> : null}

            <Segmented options={KINDS} value={kind} onChange={setKind} />

            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: existing }}
              onPress={() => setExisting((value) => !value)}
              style={[
                styles.existing,
                { borderColor: existing ? theme.primary : theme.border, backgroundColor: existing ? theme.primary5 : "transparent" },
              ]}
            >
              <View style={[styles.box, existing ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.mutedForeground }]}>
                {existing ? (
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill={theme.primaryForeground} />
                  </Svg>
                ) : null}
              </View>
              <View style={styles.flex}>
                <AppText size={14} weight={500} lineHeight={20}>
                  Pinjaman lama
                </AppText>
                <AppText size={13} tone="mutedForeground">
                  Sudah terjadi sebelum pakai Lajur. Saldo dompet tidak berubah.
                </AppText>
              </View>
            </Pressable>

            <FormField
              label={kind === "lend" ? "Dipinjamkan ke" : "Dipinjam dari"}
              hint="Nama yang sama akan digabung ke pinjaman orang itu."
              error={fieldErrors.counterparty}
            >
              <Input
                value={name}
                onChangeText={setName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                // Kolom pertama aktif; kalau nama sudah terisi (dari halaman orang itu), nominal yang aktif.
                autoFocus={!initialName}
                autoComplete="off"
                maxLength={40}
                placeholder="mis. Andi"
                invalid={Boolean(fieldErrors.counterparty)}
                accessibilityLabel={kind === "lend" ? "Dipinjamkan ke" : "Dipinjam dari"}
              />
              {suggestions.length > 0 ? (
                <View style={[styles.suggestions, { borderColor: theme.border, backgroundColor: theme.background }]}>
                  {suggestions.map((item) => (
                    <Pressable
                      key={item}
                      accessibilityRole="button"
                      onPress={() => {
                        setName(item);
                        setNameFocused(false);
                      }}
                      style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: theme.muted }]}
                    >
                      <AppText size={15}>{item}</AppText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </FormField>

            <FormField label={existing ? "Sisa yang belum dibayar" : "Nominal"} error={fieldErrors.amount}>
              <MoneyInput
                value={amount}
                onChangeText={(text) => setAmount(formatAmountInput(text))}
                autoFocus={Boolean(initialName)}
                invalid={Boolean(fieldErrors.amount)}
                accessibilityLabel={existing ? "Sisa yang belum dibayar" : "Nominal"}
              />
            </FormField>

            {!existing ? (
              walletList.length === 0 ? (
                <NoWallets />
              ) : (
                <View>
                  <Legend>{kind === "lend" ? "Diambil dari dompet" : "Masuk ke dompet"}</Legend>
                  <WalletPicker wallets={walletList} selected={selectedWallet} onSelect={setWalletId} />
                  {fieldErrors.walletId ? (
                    <AppText size={13} tone="destructive" style={styles.errorBelow}>
                      {fieldErrors.walletId}
                    </AppText>
                  ) : null}
                </View>
              )
            ) : null}

            <FormField label="Tanggal" error={fieldErrors.transactionDate}>
              <DateField value={transactionDate} onChange={setDate} max={today} invalid={Boolean(fieldErrors.transactionDate)} accessibilityLabel="Tanggal" />
            </FormField>
            <FormField label="Catatan (opsional)" error={fieldErrors.note}>
              <Input value={note} onChangeText={setNote} maxLength={255} placeholder="mis. Untuk bayar kos" invalid={Boolean(fieldErrors.note)} accessibilityLabel="Catatan (opsional)" />
            </FormField>

            <FormField label="Jatuh tempo (opsional)" hint="Kalau dikosongkan, jatuh tempo lama orang ini tidak berubah." error={fieldErrors.dueDate}>
              <DateField value={dueDate} onChange={setDueDate} clearable invalid={Boolean(fieldErrors.dueDate)} accessibilityLabel="Jatuh tempo (opsional)" />
            </FormField>

            <AppText size={13} tone="mutedForeground">
              {existing
                ? "Pinjaman lama hanya menambah sisa pinjaman; dompet dan ringkasan bulanan tidak berubah."
                : `Pinjaman tidak dihitung sebagai ${kind === "lend" ? "pengeluaran" : "pemasukan"} bulanan.`}
            </AppText>

            <Button label={record.isPending ? "Menyimpan…" : "Simpan"} big onPress={() => submit(close)} disabled={record.isPending} />
          </View>
        )
      }
    </Sheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  form: { gap: 20 },
  existing: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: RADIUS.xl, paddingHorizontal: 12, paddingVertical: 8 },
  box: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  suggestions: { borderWidth: 1, borderRadius: RADIUS.xl, overflow: "hidden" },
  suggestion: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16 },
  errorBelow: { marginTop: 6 },
});
