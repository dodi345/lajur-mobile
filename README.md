# Lajur untuk Android

App Android native (React Native + Expo SDK 58) untuk **Lajur - Catat Uangmu**. Data dan aturan bisnis
ada di server Lajur (repo `money-management`, API `/api/v1`); app ini hanya tampilan native-nya.

Tampilan app **sama persis dengan PWA Lajur**: font Inter, ikon Boxicons (glyph yang sama, digambar dengan
`react-native-svg`), token warna terang/gelap, logo bank/e-wallet, nav bawah kapsul kaca (Beranda · Transaksi · + ·
Target · Akun), form sebagai bottom sheet, dan toast di atas layar.

Isi: masuk/daftar, Beranda, Transaksi (filter dompet/kategori/jenis, total per tanggal), Dompet (daftar, tambah dengan
logo, detail), Ringkasan bulanan, Target (daftar), Akun (profil, tema, kurangi efek kaca, keluar). Yang belum ada
di API app (koreksi saldo/ubah/arsip dompet, buat target, ubah profil, utang & piutang, kategori, ekspor, akun demo)
membuka halaman yang sama di web Lajur.

## Pratinjau cepat di browser

```bash
npm run preview
```

Lalu buka http://localhost:8090 di Chrome (Ctrl+Shift+M = ukuran HP) dan masuk dengan akun Lajur lokal. Perintah ini
menyalakan Lajur lokal (repo `money-management` di sebelah repo ini) kalau belum jalan, proxy, dan versi web app.
Ctrl+C mematikan semuanya.

## Menjalankan saat pengembangan

1. Pasang **Expo Go** di HP Android (Play Store).
2. Di laptop:
   ```bash
   npm install
   npx expo start
   ```
3. Scan QR dari terminal dengan Expo Go (HP dan laptop di Wi-Fi yang sama). Perubahan kode langsung muncul.

Secara bawaan app memakai server produksi `https://lajur.stackfolio.web.id`. Untuk memakai Lajur yang
berjalan di laptop:

```bash
# terminal 1 (repo money-management)
npm run dev -- -H 0.0.0.0
# terminal 2 (repo ini); ganti dengan IP laptop di Wi-Fi (ip -4 addr)
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000 npx expo start
```

Kalau HP tidak bisa menjangkau laptop (firewall/Wi-Fi tamu): `npx expo start --tunnel`.

## Perintah

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npm test            # jest (jest-expo): format rupiah/tanggal, klien API, sesi login
npx expo-doctor     # cek kecocokan dependency dengan SDK
```

## Struktur

```
src/app/            layar (expo-router): login + register (di akar), (app)/(tabs)/ empat tab, transaction/, wallet/, profile
src/components/     ui (teks, tombol, input, chip), icon (Boxicons), glass, sheet, screen (halaman + nav bawah), finance,
                    wallet-logo, transaction-form, picker, toast, auth-shell
src/lib/            api (klien /api/v1 + tipe), auth (sesi, SecureStore), queries (TanStack Query), money, date,
                    theme (token = globals.css web, tema per perangkat), boxicons (data path ikon, dibangkitkan)
assets/logos/       logo bank/e-wallet, ilustrasi dompet tunai, logo Lajur (file yang sama dengan public/ web)
```

## Keamanan

- Login memakai endpoint Better Auth biasa; server mengirim token sesi di header `set-auth-token`
  (plugin `bearer`). Token disimpan terenkripsi di Android Keystore (`expo-secure-store`) dan dikirim sebagai
  `Authorization: Bearer`. Token = sesi biasa: terlihat dan bisa dikeluarkan dari web (Profil → Perangkat yang login).
- Server menolak token → app langsung kembali ke layar Masuk.
- Tidak ada rahasia di repo ini. Keystore penanda tangan APK (tahap berikutnya) hanya di password manager dan
  GitHub Secrets.

## Membuat rilis (APK)

APK dibangun di GitHub Actions, tidak di laptop atau server. Caranya:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

Workflow `Rilis APK` lalu: menjalankan lint/typecheck/test → `expo prebuild` → Gradle `assembleRelease` (arm64 + armv7)
→ memastikan APK ditandatangani kunci Lajur → membuat GitHub Release berisi `lajur.apk` + checksum (±15–20 menit).

- Nomor versi hanya dari tag: `v1.2.3` → versi 1.2.3, versionCode 10203. Tag berikutnya harus selalu lebih besar,
  kalau tidak Android menolak update.
- Unduhan versi terbaru selalu di `https://github.com/dodi345/lajur-mobile/releases/latest/download/lajur.apk`.
- Kunci tanda tangan (keystore PKCS12, alias `lajur`) hanya ada di password manager dan di secret GitHub
  `ANDROID_KEYSTORE_BASE64` + `ANDROID_KEYSTORE_PASSWORD`. `plugins/with-release-signing.js` memasangnya ke build;
  tanpa variabel itu (build lokal) rilis memakai kunci debug. **Kunci hilang = update tidak bisa menimpa app lama.**
