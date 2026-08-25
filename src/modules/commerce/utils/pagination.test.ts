import { describe, expect, it } from "vitest";
import { parseCatalogueQuery } from "../models/catalogue-query";
import { buildPagination } from "./pagination";

function queryOn(page: number) {
  const search = new URLSearchParams(page === 1 ? "" : `page=${page}`);
  const result = parseCatalogueQuery({ kind: "concern", slug: "lak" }, search);
  if (result.kind === "invalid") throw new Error("expected a parseable query");
  return result.query;
}

describe("buildPagination", () => {
  it("reports a single page when everything fits", () => {
    const pagination = buildPagination("fa", queryOn(1), {
      total: 12,
      pageSize: 24,
    });

    expect(pagination.pageCount).toBe(1);
    expect(pagination.previousHref).toBeNull();
    expect(pagination.nextHref).toBeNull();
    expect(pagination.pages).toEqual([
      { page: 1, href: "/fa/shop/concern/lak", isCurrent: true },
    ]);
  });

  it("reports one page for an empty result set, not zero", () => {
    // Given: zero results is a ready page with an empty state, so page 1 exists
    const pagination = buildPagination("fa", queryOn(1), {
      total: 0,
      pageSize: 24,
    });

    expect(pagination.pageCount).toBe(1);
    expect(pagination.isOutOfRange).toBe(false);
  });

  it("omits page=1 from the first page's href", () => {
    const pagination = buildPagination("fa", queryOn(2), {
      total: 60,
      pageSize: 24,
    });

    expect(pagination.previousHref).toBe("/fa/shop/concern/lak");
    expect(pagination.nextHref).toBe("/fa/shop/concern/lak?page=3");
  });

  it("has no next link on the last page", () => {
    const pagination = buildPagination("fa", queryOn(3), {
      total: 60,
      pageSize: 24,
    });

    expect(pagination.pageCount).toBe(3);
    expect(pagination.nextHref).toBeNull();
    expect(pagination.previousHref).toBe("/fa/shop/concern/lak?page=2");
  });

  it("flags a page beyond the end instead of quietly showing nothing", () => {
    // Given: a stale link or a hand-edited URL. An empty grid on page 40 of 3
    // looks like a broken catalogue; the route needs to know it was out of range.
    const pagination = buildPagination("fa", queryOn(40), {
      total: 60,
      pageSize: 24,
    });

    expect(pagination.isOutOfRange).toBe(true);
    expect(pagination.lastPageHref).toBe("/fa/shop/concern/lak?page=3");
  });

  it("windows a long run of pages around the current one", () => {
    const pagination = buildPagination("fa", queryOn(10), {
      total: 480,
      pageSize: 24,
      window: 2,
    });

    expect(pagination.pageCount).toBe(20);
    expect(pagination.pages.map((entry) => entry.page)).toEqual([
      8, 9, 10, 11, 12,
    ]);
    expect(pagination.pages.filter((entry) => entry.isCurrent)).toHaveLength(1);
  });

  it("keeps the window full at the edges rather than shrinking it", () => {
    const first = buildPagination("fa", queryOn(1), {
      total: 480,
      pageSize: 24,
      window: 2,
    });
    const last = buildPagination("fa", queryOn(20), {
      total: 480,
      pageSize: 24,
      window: 2,
    });

    expect(first.pages.map((entry) => entry.page)).toEqual([1, 2, 3, 4, 5]);
    expect(last.pages.map((entry) => entry.page)).toEqual([16, 17, 18, 19, 20]);
  });

  it("carries every other query parameter into every page link", () => {
    const search = new URLSearchParams("brand=forlled&sort=price_asc&page=2");
    const parsed = parseCatalogueQuery(
      { kind: "concern", slug: "lak" },
      search,
    );
    if (parsed.kind === "invalid")
      throw new Error("expected a parseable query");

    const pagination = buildPagination("fa", parsed.query, {
      total: 100,
      pageSize: 24,
    });

    expect(pagination.nextHref).toBe(
      "/fa/shop/concern/lak?brand=forlled&sort=price_asc&page=3",
    );
  });
});
