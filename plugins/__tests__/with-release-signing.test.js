const { addReleaseSigning } = require("../with-release-signing");

// Potongan android/app/build.gradle hasil `expo prebuild` SDK 58 (bagian yang diubah plugin).
const TEMPLATE = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            signingConfig signingConfigs.debug
            minifyEnabled enableMinifyInReleaseBuilds
        }
    }
}`;

describe("addReleaseSigning", () => {
  it("rilis memakai kunci Lajur kalau LAJUR_KEYSTORE_PATH ada, debug tetap kunci debug", () => {
    const result = addReleaseSigning(TEMPLATE);
    expect(result).toContain('storeFile file(lajurKeystore)');
    expect(result).toContain(
      'signingConfig System.getenv("LAJUR_KEYSTORE_PATH") ? signingConfigs.release : signingConfigs.debug',
    );
    // buildTypes.debug tidak berubah.
    expect(result).toMatch(/debug \{\s*signingConfig signingConfigs\.debug\s*\}/);
    // Password tidak pernah ditulis ke file, hanya dibaca dari environment saat build.
    expect(result).toContain('storePassword System.getenv("LAJUR_KEYSTORE_PASSWORD")');
  });

  it("aman dijalankan dua kali (prebuild ulang)", () => {
    const once = addReleaseSigning(TEMPLATE);
    expect(addReleaseSigning(once)).toBe(once);
  });

  it("gagal keras kalau bentuk template berubah, daripada diam-diam memakai kunci debug", () => {
    expect(() => addReleaseSigning("android { }")).toThrow(/buildTypes\.release/);
  });
});
