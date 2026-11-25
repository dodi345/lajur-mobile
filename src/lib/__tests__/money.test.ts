import { formatAmountInput, formatPercent, formatRupiah, formatSigned, groupThousands, parseAmountInput } from "@/lib/money";

// Format harus sama dengan web Lajur (lib/domain/money.ts): "Rp 25.000", minus "−Rp 2.500".
describe("format rupiah", () => {
  it("pemisah ribuan titik, spasi tak terputus, tanda minus U+2212", () => {
    expect(groupThousands(1250000)).toBe("1.250.000");
    expect(groupThousands(999)).toBe("999");
    expect(formatRupiah(25000)).toBe("Rp 25.000");
    expect(formatRupiah(-2500)).toBe("−Rp 2.500");
    expect(formatRupiah(0)).toBe("Rp 0");
  });

  it("tanda arah untuk pemasukan/pengeluaran", () => {
    expect(formatSigned(50000, "in")).toBe("+Rp 50.000");
    expect(formatSigned(25000, "out")).toBe("−Rp 25.000");
    expect(formatSigned(10000, "none")).toBe("Rp 10.000");
  });

  it("input yang diketik: hanya angka, titik otomatis, nol di depan dibuang", () => {
    expect(formatAmountInput("1250000")).toBe("1.250.000");
    expect(formatAmountInput("Rp 25.000,50")).toBe("2.500.050");
    expect(formatAmountInput("0007")).toBe("7");
    expect(formatAmountInput("")).toBe("");
    expect(parseAmountInput("1.250.000")).toBe(1250000);
    expect(parseAmountInput("")).toBeNull();
  });
});

describe("formatPercent", () => {
  it("sama dengan Intl id-ID percent web (maks. 1 desimal, koma)", () => {
    expect(formatPercent(0.691)).toBe("69,1%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(0.025)).toBe("2,5%");
    expect(formatPercent(0.0244)).toBe("2,4%");
  });
});
