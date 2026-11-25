// Config plugin: APK rilis ditandatangani kunci Lajur, bukan kunci debug bawaan template.
//
// Kunci tidak pernah ada di repo. Di GitHub Actions, workflow rilis menulis keystore dari secret ke
// file sementara lalu mengisi LAJUR_KEYSTORE_PATH + LAJUR_KEYSTORE_PASSWORD. Tanpa variabel itu
// (build di laptop), rilis tetap memakai kunci debug supaya `expo run:android --variant release` jalan.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// lajur: release signing";

const RELEASE_SIGNING = `
        ${MARKER}
        release {
            def lajurKeystore = System.getenv("LAJUR_KEYSTORE_PATH")
            if (lajurKeystore) {
                storeFile file(lajurKeystore)
                storePassword System.getenv("LAJUR_KEYSTORE_PASSWORD")
                keyAlias System.getenv("LAJUR_KEY_ALIAS") ?: "lajur"
                keyPassword System.getenv("LAJUR_KEYSTORE_PASSWORD")
            }
        }`;

/** Mengubah isi android/app/build.gradle; gagal keras kalau bentuk template berubah. */
function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  // Ganti dulu signingConfig di buildTypes.release (sebelum blok release baru ikut menambah "release {").
  const buildTypeRelease = /(buildTypes\s*\{[\s\S]*?\brelease\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  if (!buildTypeRelease.test(gradle)) {
    throw new Error("with-release-signing: buildTypes.release di build.gradle tidak ditemukan");
  }
  let next = gradle.replace(
    buildTypeRelease,
    '$1signingConfig System.getenv("LAJUR_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
  );

  if (!/signingConfigs\s*\{/.test(next)) {
    throw new Error("with-release-signing: blok signingConfigs di build.gradle tidak ditemukan");
  }
  next = next.replace(/signingConfigs\s*\{/, (match) => match + RELEASE_SIGNING);
  return next;
}

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy") {
      throw new Error("with-release-signing: hanya mendukung build.gradle (Groovy)");
    }
    mod.modResults.contents = addReleaseSigning(mod.modResults.contents);
    return mod;
  });
}

module.exports = withReleaseSigning;
module.exports.addReleaseSigning = addReleaseSigning;
