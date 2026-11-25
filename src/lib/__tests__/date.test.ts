import { dayLabel, displayDate, groupLabel, isIsoDate, monthLabel, parseDisplayDate, shiftDay, shiftMonth, shortDate } from "@/lib/date";

describe("tanggal", () => {
  it("geser hari/bulan lintas batas bulan dan tahun", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("label bahasa Indonesia, sama dengan web", () => {
    expect(monthLabel("2026-11")).toBe("November 2026");
    expect(dayLabel("2026-11-08")).toBe("Min, 8 Nov");
    expect(groupLabel("2026-11-08", "2026-11-08")).toBe("Hari ini · Min, 8 Nov");
    expect(groupLabel("2026-11-07", "2026-11-08")).toBe("Kemarin · Sab, 7 Nov");
    expect(groupLabel("2026-11-06", "2026-11-08")).toBe("Jum, 6 Nov");
    expect(groupLabel("2026-11-06", undefined)).toBe("Jum, 6 Nov");
  });

  it("tanggal ketikan HH/BB/TTTT; tanggal mustahil ditolak", () => {
    expect(parseDisplayDate("8/11/2026")).toBe("2026-11-08");
    expect(parseDisplayDate("31/02/2026")).toBeNull();
    expect(parseDisplayDate("2026-11-08")).toBeNull();
    expect(displayDate("2026-11-08")).toBe("08/11/2026");
    expect(isIsoDate("2026-02-30")).toBe(false);
  });
});

describe("shortDate", () => {
  it("12 Agu 2026 (sama dengan formatShortDate web)", () => {
    expect(shortDate("2026-08-12")).toBe("12 Agu 2026");
    expect(shortDate("2027-06-30")).toBe("30 Jun 2027");
  });
});
