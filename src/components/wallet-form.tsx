import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useToast } from "@/components/toast";
import { AppText, Button, ChoiceChip, FormField, FormMessage, Input, MoneyInput } from "@/components/ui";
import { brandsForType, findBrand } from "@/components/wallet-logo";
import { ApiError } from "@/lib/api";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { useCreateWallet, type WalletInput } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Form tambah dompet (US-03) = components/wallets/wallet-form.tsx web: jenis, logo, nama, saldo saat ini
// (dicatat sebagai saldo awal / adjustment, BR-04). Dipakai sheet "Tambah dompet" dan halaman onboarding.

type WalletKind = WalletInput["type"];

const KINDS: { value: WalletKind; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-wallet" },
  { value: "savings", label: "Tabungan" },
];
const CASH_NAME = "Tunai";

/**
 * `onboarding` (belum ada dompet aktif): tombol utama "Mulai mencatat", tanpa toast. `onDone` dipanggil setelah
 * tombol utama berhasil; "Simpan & tambah dompet lain" mengosongkan form (jenis kembali Bank), sama dengan web.
 */
export function WalletForm({ onboarding, onDone }: { onboarding: boolean; onDone: () => void }) {
  const create = useCreateWallet();
  const toast = useToast();
  const [type, setType] = useState<WalletKind>("bank");
  const [brand, setBrand] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [pendingAgain, setPendingAgain] = useState(false);
  const fieldErrors = (create.error instanceof ApiError ? create.error.fieldErrors : undefined) ?? {};

  // Nama yang masih bawaan (kosong, nama logo, atau "Tunai") boleh diganti otomatis.
  const nameIsAutomatic = name.trim() === "" || name === findBrand(brand)?.label || name === CASH_NAME;

  const pickType = (next: WalletKind) => {
    setType(next);
    // Logo yang tidak cocok dengan jenis baru dilepas (mis. GoPay saat pindah ke Bank).
    const keepBrand = brandsForType(next).some((option) => option.id === brand);
    if (!keepBrand) setBrand(null);
    if (nameIsAutomatic) setName(next === "cash" ? CASH_NAME : keepBrand ? name : "");
  };
  const pickBrand = (id: string | null) => {
    setBrand(id);
    if (nameIsAutomatic) setName(findBrand(id)?.label ?? "");
  };

  const submit = (again: boolean) => {
    setPendingAgain(again);
    create.mutate(
      { name: name.trim(), type, brand: type === "cash" ? null : brand, openingBalance: parseAmountInput(balance) },
      {
        onSuccess: () => {
          if (again) {
            toast({ message: "Dompet tersimpan. Tambah dompet berikutnya.", type: "success" });
            setType("bank");
            setBrand(null);
            setName("");
            setBalance("");
            return;
          }
          // Web: "Mulai mencatat" langsung ke Beranda tanpa toast.
          if (!onboarding) toast({ message: "Dompet tersimpan.", type: "success" });
          onDone();
        },
      },
    );
  };

  return (
    <View style={styles.form}>
      {create.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={create.error.message} /> : null}
      <View>
        <AppText size={13} weight={500} tone="mutedForeground" style={styles.legend}>
          Jenis
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.kinds}>
          {KINDS.map((kind) => (
            <ChoiceChip key={kind.value} label={kind.label} selected={type === kind.value} onPress={() => pickType(kind.value)} style={styles.kindChip} />
          ))}
        </ScrollView>
        {fieldErrors.type ? (
          <AppText size={13} tone="destructive" style={styles.errorBelow}>
            {fieldErrors.type}
          </AppText>
        ) : null}
      </View>

      {type !== "cash" ? (
        // Ketuk logo yang sudah dipilih sekali lagi = batal pilih (dompet tanpa logo).
        <BrandGrid type={type} selected={brand} onSelect={(id) => pickBrand(brand === id ? null : id)} error={fieldErrors.brand} />
      ) : null}

      <FormField label="Nama dompet" error={fieldErrors.name}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={type === "savings" ? "mis. Jago - Dana Darurat" : "mis. BCA Utama"}
          maxLength={50}
          invalid={Boolean(fieldErrors.name)}
          accessibilityLabel="Nama dompet"
        />
      </FormField>

      <FormField
        label="Saldo saat ini"
        error={fieldErrors.openingBalance}
        hint="Lihat saldo di aplikasi bank atau e-wallet kamu. Dicatat sebagai saldo awal, bukan pemasukan."
      >
        <MoneyInput value={balance} onChangeText={(text) => setBalance(formatAmountInput(text))} invalid={Boolean(fieldErrors.openingBalance)} accessibilityLabel="Saldo saat ini" />
      </FormField>

      <View style={styles.actions}>
        <Button
          label={create.isPending && !pendingAgain ? "Menyimpan…" : onboarding ? "Mulai mencatat" : "Simpan"}
          big
          onPress={() => submit(false)}
          disabled={create.isPending}
        />
        <Button
          label={create.isPending && pendingAgain ? "Menyimpan…" : "Simpan & tambah dompet lain"}
          variant="outline"
          big
          onPress={() => submit(true)}
          disabled={create.isPending}
        />
      </View>
    </View>
  );
}

/** Grid logo 4 kolom: opasitas 45%, terpilih = latar primary 5% (gelap: kotak terang + cincin primary). */
function BrandGrid({
  type,
  selected,
  onSelect,
  error,
}: {
  type: WalletKind;
  selected: string | null;
  onSelect: (id: string) => void;
  error?: string;
}) {
  const theme = useTheme();
  return (
    <View>
      <AppText size={13} weight={500} tone="mutedForeground" style={styles.legend}>
        Logo
      </AppText>
      <View style={styles.grid}>
        {brandsForType(type).map((brand) => {
          const active = brand.id === selected;
          return (
            <View key={brand.id} style={styles.cell}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={brand.label}
                onPress={() => onSelect(brand.id)}
                style={[
                  styles.brand,
                  { opacity: active ? 1 : 0.45 },
                  theme.dark ? { backgroundColor: theme.logoTile } : active && { backgroundColor: theme.primary5 },
                  theme.dark && active && { borderWidth: 2, borderColor: theme.primary },
                ]}
              >
                <Image source={brand.logo} style={styles.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
              </Pressable>
            </View>
          );
        })}
      </View>
      {error ? (
        <AppText size={13} tone="destructive" style={styles.errorBelow}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  legend: { marginBottom: 8 },
  errorBelow: { marginTop: 6 },
  bleed: { marginHorizontal: -16 },
  kinds: { gap: 8, paddingHorizontal: 16 },
  kindChip: { paddingHorizontal: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -2, rowGap: 4 },
  cell: { width: "25%", paddingHorizontal: 2 },
  brand: { height: 48, borderRadius: RADIUS.xl, padding: 8 },
  logo: { width: "100%", height: "100%" },
  actions: { marginTop: 8, gap: 12 },
});
