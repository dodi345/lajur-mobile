# CLAUDE.md

**Lajur untuk Android**: app native (React Native + Expo SDK 58, TypeScript strict) untuk Lajur - Catat Uangmu.
Selalu balas dalam **Bahasa Indonesia**. Panduan Expo umum ada di `AGENTS.md` (dari template Expo).

## Hubungan dengan server

- Semua data dan aturan bisnis (BR-xx) ada di server Lajur (repo `money-management`, `/api/v1`, lihat
  `docs/technical-design.md` §5 di repo itu). App **tidak** menghitung saldo, ringkasan, atau validasi akhir;
  app hanya menampilkan hasil server dan pesan error per field dari server.
- Kalau app butuh data/endpoint baru: tambahkan di `money-management` dulu (dengan test), baru dipakai di sini.
- "Hari ini" dan "bulan ini" selalu dari server (zona waktu user, BR-06), bukan jam HP.

## Stack (terkunci, jangan tambah library tanpa izin)

- Expo SDK 58, expo-router (Stack, `Stack.Protected`, `NativeTabs`), React Native 0.88
- `@tanstack/react-query` untuk data, `expo-secure-store` untuk token dan pilihan tampilan
- Tampilan: `@expo-google-fonts/inter`, `react-native-svg` (ikon Boxicons + logo), `expo-blur` (efek kaca),
  `@react-native-community/datetimepicker` (pilih tanggal)
- Jest (`jest-expo`) + `@testing-library/react-native` untuk test
- Pasang paket dengan `npx expo install` (versi cocok dengan SDK), bukan `npm install <paket>`
- Tidak ada `android/` atau `ios/` di repo (dibuat `expo prebuild` saat build)
- Rilis: tag `vX.Y.Z` → `.github/workflows/release.yml` membangun APK bertanda tangan di GitHub Actions (lihat README). Jangan ubah alur penandatanganan (`plugins/with-release-signing.js`) tanpa izin

## Aturan UI

- **Tampilan harus identik dengan PWA Lajur** (keputusan pengguna 2026-11-25). Sebelum mengubah layar, lihat komponen
  web yang sama di `money-management` dan cocokkan ukuran, warna, teks, dan ikon. Jangan memakai komponen bergaya
  bawaan Android (tab Material, dialog Material, Material Symbols).
- Token warna, radius, dan font hanya dari `src/lib/theme.tsx` (= `app/globals.css` web); jangan pakai warna mentah
  di layar. Font Inter 400/500/600/700 lewat `font()` / `AppText`, ikon hanya Boxicons lewat `Icon`.
- Pengeluaran merah + "−", pemasukan hijau + "+", transfer abu-abu; aksi berbahaya selalu punya label teks.
- Nominal: `formatRupiah` ("Rp 25.000"), `tabular-nums`. Area sentuh minimal 44×44.
- Hapus transaksi tanpa dialog: toast "Transaksi dihapus · Batal" (BR-10).
- Setiap layar punya tampilan memuat, error (+ "Coba lagi"), dan kosong.

## Cara bekerja

- Kerjakan satu fitur per sesi. Untuk tugas yang menyentuh lebih dari 3 file atau memasang paket baru: tampilkan
  rencana dan daftar paket dulu, tunggu persetujuan.
- Sebelum menyatakan selesai: `npm run typecheck`, `npm run lint`, `npm test` harus bersih.
- **Jangan commit atau push tanpa diminta**; kalau diminta, usulkan pesan commit dulu (tanpa baris attribution).
