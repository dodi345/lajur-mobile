import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { Icon, type BoxIconName } from "@/components/icon";
import type { WalletType } from "@/lib/api";
import { RADIUS, useTheme } from "@/lib/theme";

// Logo dompet = web (components/wallets/wallet-logo.tsx): kotak 56×40, logo bank/e-wallet (file sama
// dengan public/ web), ilustrasi dompet untuk Tunai tanpa merek, atau ikon jenis dompet.

export const WALLET_BRANDS: { id: string; label: string; kind: "bank" | "ewallet"; logo: ImageSourcePropType }[] = [
  { id: "bca", label: "BCA", kind: "bank", logo: require("@/assets/logos/bca-logo.webp") },
  { id: "bri", label: "BRI", kind: "bank", logo: require("@/assets/logos/bri-logo.webp") },
  { id: "mandiri", label: "Mandiri", kind: "bank", logo: require("@/assets/logos/mandiri-logo.webp") },
  { id: "bni", label: "BNI", kind: "bank", logo: require("@/assets/logos/bni-logo.webp") },
  { id: "bsi", label: "BSI", kind: "bank", logo: require("@/assets/logos/bsi-logo.webp") },
  { id: "btn", label: "BTN", kind: "bank", logo: require("@/assets/logos/btn-logo.webp") },
  { id: "cimb", label: "CIMB Niaga", kind: "bank", logo: require("@/assets/logos/cimb-niaga-logo.webp") },
  { id: "permata", label: "Permata", kind: "bank", logo: require("@/assets/logos/permata-bank-logo.webp") },
  { id: "danamon", label: "Danamon", kind: "bank", logo: require("@/assets/logos/danamon-logo.webp") },
  { id: "ocbc", label: "OCBC", kind: "bank", logo: require("@/assets/logos/ocbc-logo.webp") },
  { id: "jago", label: "Jago", kind: "bank", logo: require("@/assets/logos/jago-logo.webp") },
  { id: "seabank", label: "SeaBank", kind: "bank", logo: require("@/assets/logos/seabank-logo.webp") },
  { id: "blu", label: "blu", kind: "bank", logo: require("@/assets/logos/blu-logo.webp") },
  { id: "jenius", label: "Jenius", kind: "bank", logo: require("@/assets/logos/jenius-logo.png") },
  { id: "allo", label: "Allo Bank", kind: "bank", logo: require("@/assets/logos/allo-bank.webp") },
  { id: "superbank", label: "superbank", kind: "bank", logo: require("@/assets/logos/superbank-logo.webp") },
  { id: "gopay", label: "GoPay", kind: "ewallet", logo: require("@/assets/logos/gopay-logo.webp") },
  { id: "ovo", label: "OVO", kind: "ewallet", logo: require("@/assets/logos/ovo-logo.webp") },
  { id: "dana", label: "DANA", kind: "ewallet", logo: require("@/assets/logos/dana-logo.webp") },
  { id: "shopeepay", label: "ShopeePay", kind: "ewallet", logo: require("@/assets/logos/shopeepay-logo.webp") },
  { id: "linkaja", label: "LinkAja", kind: "ewallet", logo: require("@/assets/logos/linkaja-logo.webp") },
  { id: "isaku", label: "i.saku", kind: "ewallet", logo: require("@/assets/logos/i-saku-logo.webp") },
  { id: "astrapay", label: "AstraPay", kind: "ewallet", logo: require("@/assets/logos/astrapay-logo.webp") },
];

const CASH_LOGO: ImageSourcePropType = require("@/assets/logos/cash-logo.webp");
export const APP_LOGO: ImageSourcePropType = require("@/assets/logos/logo.webp");

const TYPE_ICONS: Partial<Record<WalletType, BoxIconName>> = { bank: "Bank", ewallet: "Wallet", savings: "PiggyBank" };

export function findBrand(id: string | null | undefined) {
  return WALLET_BRANDS.find((brand) => brand.id === id);
}

/** Merek yang bisa dipilih per jenis: bank → bank, e-wallet → e-wallet, tabungan → semua, tunai → tidak ada. */
export function brandsForType(type: WalletType) {
  if (type === "savings") return WALLET_BRANDS;
  return WALLET_BRANDS.filter((brand) => brand.kind === type);
}

export function WalletLogo({ type, brand }: { type: WalletType; brand: string | null }) {
  const theme = useTheme();
  const found = findBrand(brand);
  if (found) {
    return (
      <View style={styles.box}>
        {/* Mode gelap: logo bertinta gelap diberi kotak terang supaya tetap terbaca (sama dengan web). */}
        <View style={[styles.fill, theme.dark && [styles.tile, { backgroundColor: theme.logoTile }]]}>
          <Image source={found.logo} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
        </View>
      </View>
    );
  }
  if (type === "cash") {
    return (
      <View style={styles.box}>
        <Image source={CASH_LOGO} style={styles.image} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[styles.box, styles.center]}>
      <Icon name={TYPE_ICONS[type] ?? "Wallet"} size={20} color={theme.mutedForeground} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 56, height: 40 },
  fill: { flex: 1 },
  tile: { borderRadius: RADIUS.lg, paddingHorizontal: 6, paddingVertical: 4 },
  image: { width: "100%", height: "100%" },
  center: { alignItems: "center", justifyContent: "center" },
});
