import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { AppText, Button, ChoiceChip, FormField, FormMessage, Input, MoneyInput } from "@/components/ui";
import { brandsForType, findBrand } from "@/components/wallet-logo";
import { ApiError } from "@/lib/api";
import { formatAmountInput, parseAmountInput } from "@/lib/money";
import { useCreateWallet, type WalletInput } from "@/lib/queries";
import { RADIUS, useTheme } from "@/lib/theme";

// Tambah dompet (US-03) = components/wallets/wallet-form.tsx web: jenis, logo, nama, saldo saat ini
// (dicatat sebagai saldo awal / adjustment, BR-04).

type WalletKind = WalletInput["type"];

const KINDS: { value: WalletKind; label: string }[] = [
  { value: "cash", label: "Tunai" },
  { value: "bank", label: "Bank" },
  { value: "ewallet", label: "E-wallet" },
  { value: "savings", label: "Tabungan" },
];

export default function NewWalletScreen() {
  const create = useCreateWallet();
  const toast = useToast();
  const [type, setType] = useState<WalletKind>("bank");
  const [brand, setBrand] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const error = create.error instanceof ApiError ? create.error : null;
  const fieldErrors = error?.fieldErrors ?? {};

  const chooseType = (next: WalletKind) => {
    setType(next);
    if (brand && !brandsForType(next).some((option) => option.id === brand)) setBrand(null);
    if (next === "cash" && !name) setName("Tunai");
  };
  const chooseBrand = (id: string) => {
    if (brand === id) return setBrand(null);
    setBrand(id);
    // Nama otomatis = nama merek (bisa diganti), seperti web.
    if (!name || findBrand(brand)?.label === name || name === "Tunai") setName(findBrand(id)?.label ?? name);
  };

  const submit = (close: () => void, again: boolean) =>
    create.mutate(
      { name: name.trim(), type, brand: type === "cash" ? null : brand, openingBalance: parseAmountInput(balance) },
      {
        onSuccess: () => {
          toast({ message: "Dompet tersimpan.", type: "success" });
          if (again) {
            setBrand(null);
            setName("");
            setBalance("");
          } else close();
        },
      },
    );

  return (
    <Sheet title="Tambah dompet">
      {({ close }) => (
        <View style={styles.form}>
          {create.error && Object.keys(fieldErrors).length === 0 ? <FormMessage message={create.error.message} /> : null}
          <View>
            <AppText size={13} weight={500} tone="mutedForeground" style={styles.legend}>
              Jenis
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.kinds}>
              {KINDS.map((kind) => (
                <ChoiceChip key={kind.value} label={kind.label} selected={type === kind.value} onPress={() => chooseType(kind.value)} style={styles.kindChip} />
              ))}
            </ScrollView>
          </View>

          {type !== "cash" ? <BrandGrid type={type} selected={brand} onSelect={chooseBrand} /> : null}

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
            <Button label={create.isPending ? "Menyimpan…" : "Simpan"} big onPress={() => submit(close, false)} disabled={create.isPending} />
            <Button label="Simpan & tambah dompet lain" variant="outline" big onPress={() => submit(close, true)} disabled={create.isPending} />
          </View>
        </View>
      )}
    </Sheet>
  );
}

/** Grid logo 4 kolom: opasitas 45%, terpilih = latar primary 5% (gelap: kotak terang + cincin primary). */
function BrandGrid({ type, selected, onSelect }: { type: WalletKind; selected: string | null; onSelect: (id: string) => void }) {
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
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20 },
  legend: { marginBottom: 8 },
  bleed: { marginHorizontal: -16 },
  kinds: { gap: 8, paddingHorizontal: 16 },
  kindChip: { paddingHorizontal: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -2, rowGap: 4 },
  cell: { width: "25%", paddingHorizontal: 2 },
  brand: { height: 48, borderRadius: RADIUS.xl, padding: 8 },
  logo: { width: "100%", height: "100%" },
  actions: { marginTop: 8, gap: 12 },
});
