import { describe, expect, it } from "vitest";
import { derivedUuid } from "./idempotency";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("derivedUuid", () => {
  it("is a well-formed v5-shaped UUID", () => {
    // The columns it feeds are `uuid`; anything else fails at insert time,
    // which is exactly how the first version of this was caught.
    expect(derivedUuid(["order", "line"])).toMatch(UUID);
  });

  it("is stable for the same intent", () => {
    // The whole point: a retry must collide with its own first attempt, or the
    // unique index it feeds can never fire.
    expect(derivedUuid(["a", "b"])).toBe(derivedUuid(["a", "b"]));
  });

  it("differs for a different intent", () => {
    expect(derivedUuid(["a", "b"])).not.toBe(derivedUuid(["a", "c"]));
  });

  it("does not confuse different groupings of the same text", () => {
    // Joining on a separator that can appear inside a part would make
    // ["ab","c"] and ["a","bc"] one key — two different settlements sharing an
    // idempotency key is a silently skipped write.
    expect(derivedUuid(["ab", "c"])).not.toBe(derivedUuid(["a", "bc"]));
  });

  it("handles a single part and an empty list without throwing", () => {
    expect(derivedUuid(["only"])).toMatch(UUID);
    expect(derivedUuid([])).toMatch(UUID);
  });
});
