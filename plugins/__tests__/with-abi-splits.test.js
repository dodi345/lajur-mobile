const { addAbiSplits } = require("../with-abi-splits");

// Potongan android/app/build.gradle hasil `expo prebuild` SDK 58.
const TEMPLATE = `apply plugin: "com.android.application"

android {
    ndkVersion rootProject.ext.ndkVersion
    namespace 'id.web.stackfolio.lajur'
}`;

describe("addAbiSplits", () => {
  it("satu APK per prosesor (arm64 + armeabi-v7a), tanpa APK gabungan", () => {
    const result = addAbiSplits(TEMPLATE);
    expect(result).toMatch(/android \{\s*\/\/ lajur: abi splits\s*splits \{\s*abi \{/);
    expect(result).toContain('include "arm64-v8a", "armeabi-v7a"');
    expect(result).toContain("universalApk false");
    expect(result).toContain("namespace 'id.web.stackfolio.lajur'");
  });

  it("aman dijalankan dua kali (prebuild ulang)", () => {
    const once = addAbiSplits(TEMPLATE);
    expect(addAbiSplits(once)).toBe(once);
  });

  it("gagal jelas kalau blok android { } tidak ada", () => {
    expect(() => addAbiSplits("apply plugin: 'x'")).toThrow(/android \{ \}/);
  });
});
