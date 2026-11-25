// Config plugin: satu build rilis menghasilkan satu APK per jenis prosesor, bukan satu APK berisi dua.
//
// Mesin React Native/Expo (library .so) adalah bagian terbesar APK. Dengan split, HP 64-bit (hampir semua HP
// Android sekarang) cukup mengunduh versi arm64; versi 32-bit tetap ada sebagai file terpisah untuk HP lama.
// Hasil Gradle: app-arm64-v8a-release.apk dan app-armeabi-v7a-release.apk (lihat .github/workflows/release.yml).
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// lajur: abi splits";

const ABI_SPLITS = `
    ${MARKER}
    splits {
        abi {
            enable true
            reset()
            include "arm64-v8a", "armeabi-v7a"
            universalApk false
        }
    }`;

/** Menambah blok splits ke android { } di android/app/build.gradle; gagal keras kalau bentuk template berubah. */
function addAbiSplits(gradle) {
  if (gradle.includes(MARKER)) return gradle;
  if (!/^android\s*\{/m.test(gradle)) {
    throw new Error("with-abi-splits: blok android { } di build.gradle tidak ditemukan");
  }
  return gradle.replace(/^android\s*\{/m, (match) => match + ABI_SPLITS);
}

function withAbiSplits(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error("with-abi-splits: hanya mendukung build.gradle (Groovy)");
    }
    mod.modResults.contents = addAbiSplits(mod.modResults.contents);
    return mod;
  });
}

module.exports = withAbiSplits;
module.exports.addAbiSplits = addAbiSplits;
