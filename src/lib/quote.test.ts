import { describe, it, expect } from "vitest";
import { calculateQuote, type QuoteService } from "./quote";

function service(overrides: Partial<QuoteService> = {}): QuoteService {
  return {
    basePriceCents: 4000,
    baseDurationMin: 60,
    isFromPrice: false,
    variants: [],
    addons: [],
    priceRules: [],
    ...overrides,
  };
}

describe("calculateQuote", () => {
  it("geen regels: alleen de basisprijs en -duur", () => {
    const q = calculateQuote(service(), { size: "M", coat: "short" });
    expect(q.totalCents).toBe(4000);
    expect(q.durationMin).toBe(60);
    expect(q.breakdown).toHaveLength(1);
    expect(q.breakdown[0]).toMatchObject({ label: "Basis", deltaPriceCents: 4000 });
  });

  it("alleen een maatregel telt op bij de basis", () => {
    const q = calculateQuote(
      service({
        priceRules: [
          {
            id: "r1",
            attribute: "size",
            enabled: true,
            rows: [
              { value: "M", deltaPriceCents: 0, deltaDurationMin: 0 },
              { value: "L", deltaPriceCents: 1500, deltaDurationMin: 30 },
            ],
          },
        ],
      }),
      { size: "L", coat: "short" },
    );
    expect(q.totalCents).toBe(5500);
    expect(q.durationMin).toBe(90);
    expect(q.breakdown.map((b) => b.label)).toEqual(["Basis", "Maat L"]);
  });

  it("een uitgeschakelde regel telt niet mee", () => {
    const q = calculateQuote(
      service({
        priceRules: [
          {
            id: "r1",
            attribute: "size",
            enabled: false,
            rows: [{ value: "L", deltaPriceCents: 1500, deltaDurationMin: 30 }],
          },
        ],
      }),
      { size: "L" },
    );
    expect(q.totalCents).toBe(4000);
  });

  it("een variant vervangt de basisprijs en -duur", () => {
    const q = calculateQuote(
      service({
        variants: [
          { id: "v1", name: "Alleen knippen", priceCents: 3000, durationMin: 45 },
          { id: "v2", name: "Knippen + föhnen", priceCents: 5500, durationMin: 90 },
        ],
      }),
      { size: "M" },
      { variantId: "v2" },
    );
    expect(q.totalCents).toBe(5500);
    expect(q.durationMin).toBe(90);
    expect(q.breakdown[0].label).toBe("Knippen + föhnen");
  });

  it("een per-eenheid extra vermenigvuldigt met het aantal", () => {
    const q = calculateQuote(
      service({
        addons: [
          {
            id: "a1",
            name: "Ontklitten per 15 min",
            priceCents: 750,
            durationMin: 15,
            isPerUnit: true,
            unitLabel: "15 min",
          },
        ],
      }),
      { size: "M" },
      { addons: [{ addonId: "a1", quantity: 3 }] },
    );
    expect(q.totalCents).toBe(4000 + 750 * 3);
    expect(q.durationMin).toBe(60 + 15 * 3);
    expect(q.breakdown[1].label).toBe("Ontklitten per 15 min × 3");
  });

  it("een extra met negatieve delta verlaagt het totaal", () => {
    const q = calculateQuote(
      service({
        addons: [
          {
            id: "a1",
            name: "Tweede hond (korting)",
            priceCents: -1000,
            durationMin: 0,
            isPerUnit: false,
          },
        ],
      }),
      { size: "M" },
      { addons: [{ addonId: "a1", quantity: 1 }] },
    );
    expect(q.totalCents).toBe(3000);
    expect(q.breakdown[1]).toMatchObject({ label: "Tweede hond (korting)", deltaPriceCents: -1000 });
  });

  it("gewichtsregel matcht een bucket", () => {
    const q = calculateQuote(
      service({
        priceRules: [
          {
            id: "r1",
            attribute: "weight",
            enabled: true,
            rows: [
              { value: "0-10", deltaPriceCents: 0, deltaDurationMin: 0 },
              { value: ">20", deltaPriceCents: 2000, deltaDurationMin: 20 },
            ],
          },
        ],
      }),
      { weightKg: 26 },
    );
    expect(q.totalCents).toBe(6000);
    expect(q.durationMin).toBe(80);
  });
});
