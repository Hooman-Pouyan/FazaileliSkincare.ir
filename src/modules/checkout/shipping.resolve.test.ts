import { describe, expect, it } from "vitest";
import type { Rials } from "@/lib/money";
import {
  resolveShippingOptions,
  type ShippingRateRow,
} from "./shipping.resolve";

const r = (n: number) => BigInt(n) as Rials;

/** Mashhad, in Khorasan Razavi — the institute's own city. */
const MASHHAD = { cityCode: "09-01", provinceCode: "09" };
const SHIRAZ = { cityCode: "07-01", provinceCode: "07" };

function rate(
  over: Partial<ShippingRateRow> & { id: string },
): ShippingRateRow {
  return {
    method: "post",
    provinceCode: null,
    cityCode: null,
    amountRials: r(500_000),
    labelFa: "پست",
    freeAboveRials: null,
    isActive: true,
    ...over,
  };
}

describe("resolveShippingOptions", () => {
  it("offers the nationwide post rate to anywhere with no more specific rule", () => {
    const options = resolveShippingOptions(
      [rate({ id: "a", method: "post", amountRials: r(500_000) })],
      SHIRAZ,
      r(1_000_000),
    );
    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      method: "post",
      amountRials: r(500_000),
      scope: "national",
    });
  });

  it("prefers a city rule over a province rule over the national one", () => {
    // Given: courier priced three ways, most specific last so order cannot be
    // what makes the test pass.
    const options = resolveShippingOptions(
      [
        rate({ id: "n", method: "courier", amountRials: r(900_000) }),
        rate({
          id: "p",
          method: "courier",
          provinceCode: "09",
          amountRials: r(600_000),
        }),
        rate({
          id: "c",
          method: "courier",
          provinceCode: "09",
          cityCode: "09-01",
          amountRials: r(300_000),
        }),
      ],
      MASHHAD,
      r(1_000_000),
    );

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({
      amountRials: r(300_000),
      scope: "city",
      rateId: "c",
    });
  });

  it("falls back to the province rule outside the named city", () => {
    const rates = [
      rate({ id: "n", method: "courier", amountRials: r(900_000) }),
      rate({
        id: "p",
        method: "courier",
        provinceCode: "09",
        amountRials: r(600_000),
      }),
      rate({
        id: "c",
        method: "courier",
        provinceCode: "09",
        cityCode: "09-01",
        amountRials: r(300_000),
      }),
    ];
    // Neyshabur is in Khorasan Razavi but is not Mashhad.
    const options = resolveShippingOptions(
      rates,
      { cityCode: "09-02", provinceCode: "09" },
      r(1_000_000),
    );
    expect(options[0]).toMatchObject({ scope: "province", rateId: "p" });
  });

  it("offers pickup alongside delivery, and sorts the cheapest first", () => {
    const options = resolveShippingOptions(
      [
        rate({ id: "a", method: "post", amountRials: r(500_000) }),
        rate({ id: "b", method: "pickup", amountRials: r(0) }),
        rate({
          id: "c",
          method: "courier",
          provinceCode: "09",
          amountRials: r(300_000),
        }),
      ],
      MASHHAD,
      r(1_000_000),
    );
    expect(options.map((o) => o.method)).toEqual(["pickup", "courier", "post"]);
  });

  it("ignores an inactive rule entirely, rather than pricing from it", () => {
    // A deactivated city rate must not beat the active national one.
    const options = resolveShippingOptions(
      [
        rate({ id: "n", method: "courier", amountRials: r(900_000) }),
        rate({
          id: "c",
          method: "courier",
          provinceCode: "09",
          cityCode: "09-01",
          amountRials: r(10),
          isActive: false,
        }),
      ],
      MASHHAD,
      r(1_000_000),
    );
    expect(options[0]).toMatchObject({ amountRials: r(900_000), rateId: "n" });
  });

  it("offers nothing when no rule is configured", () => {
    // The state this ships in until the maintainer supplies real rates. It must
    // be empty rather than free — a missing rate is not a zero rate.
    expect(resolveShippingOptions([], MASHHAD, r(1_000_000))).toEqual([]);
  });

  it("offers nothing for a method whose only rule names another province", () => {
    const options = resolveShippingOptions(
      [rate({ id: "p", method: "courier", provinceCode: "09" })],
      SHIRAZ,
      r(1_000_000),
    );
    expect(options).toEqual([]);
  });

  it("stays deterministic if two rules of equal specificity exist", () => {
    // The partial unique indexes forbid this; if it happens anyway the quote
    // must not depend on which row the database returned first.
    const rates = [
      rate({ id: "b", method: "post", amountRials: r(700_000) }),
      rate({ id: "a", method: "post", amountRials: r(500_000) }),
    ];
    const forward = resolveShippingOptions(rates, MASHHAD, r(1_000_000));
    const reversed = resolveShippingOptions(
      [...rates].reverse(),
      MASHHAD,
      r(1_000_000),
    );
    expect(forward).toEqual(reversed);
    expect(forward[0]?.rateId).toBe("a");
  });

  describe("the free threshold", () => {
    it("charges nothing once the subtotal reaches it", () => {
      const options = resolveShippingOptions(
        [
          rate({
            id: "a",
            amountRials: r(500_000),
            freeAboveRials: r(5_000_000),
          }),
        ],
        MASHHAD,
        r(5_000_000),
      );
      expect(options[0]).toMatchObject({
        amountRials: r(0),
        listAmountRials: r(500_000),
        isFree: true,
      });
    });

    it("still charges just below it", () => {
      const options = resolveShippingOptions(
        [
          rate({
            id: "a",
            amountRials: r(500_000),
            freeAboveRials: r(5_000_000),
          }),
        ],
        MASHHAD,
        r(4_999_999),
      );
      expect(options[0]).toMatchObject({
        amountRials: r(500_000),
        isFree: false,
      });
    });

    it("is measured against the subtotal, so a null threshold is never free", () => {
      // Null means "never free". A threshold defaulting to zero would ship
      // everything for nothing the day someone forgot to set it.
      const options = resolveShippingOptions(
        [rate({ id: "a", amountRials: r(500_000), freeAboveRials: null })],
        MASHHAD,
        r(999_000_000),
      );
      expect(options[0]).toMatchObject({ isFree: false });
    });
  });
});
