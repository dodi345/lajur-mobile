# Lajur untuk Android

App Android native (React Native + Expo SDK 58) untuk **Lajur - Catat Uangmu**. Data dan aturan bisnis
ada di server Lajur (repo `money-management`, API `/api/v1`); app ini hanya tampilan native-nya.

Versi 1: masuk/daftar, Beranda (kekayaan bersih, ringkasan bulan ini, dompet, transaksi terakhir),
transaksi (daftar per bulan, catat, ubah, hapus + Batal), dompet (daftar, tambah, detail), ringkasan
bulanan, akun + keluar. Target tabungan, utang & piutang, kategori, ekspor, dan bot Telegram tetap di web.

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
src/app/            layar (expo-router): (auth)/ masuk & daftar, (app)/(tabs)/ empat tab, transaction/, wallet/, profile
src/components/     ui (teks, tombol, input, chip), finance (baris transaksi/dompet, ringkasan), form transaksi, toast
src/lib/            api (klien /api/v1 + tipe), auth (sesi, SecureStore), queries (TanStack Query), money, date, theme
```

## Keamanan

- Login memakai endpoint Better Auth biasa; server mengirim token sesi di header `set-auth-token`
  (plugin `bearer`). Token disimpan terenkripsi di Android Keystore (`expo-secure-store`) dan dikirim sebagai
  `Authorization: Bearer`. Token = sesi biasa: terlihat dan bisa dikeluarkan dari web (Profil → Perangkat yang login).
- Server menolak token → app langsung kembali ke layar Masuk.
- Tidak ada rahasia di repo ini. Keystore penanda tangan APK (tahap berikutnya) hanya di password manager dan
  GitHub Secrets.

## Membuat APK

Belum (tahap 3): APK bertanda tangan dibangun di GitHub Actions, lalu disediakan di halaman unduh.
