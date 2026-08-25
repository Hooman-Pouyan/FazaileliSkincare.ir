import {
  type CatalogueQuery,
  DEFAULT_PAGE,
  catalogueHref,
} from "../models/catalogue-query";

/**
 * Pagination links, built from the canonical query so every page keeps the
 * filters and sort that produced it. Nothing here reads the current URL — the
 * query is the input, which is what makes it testable and what stops a client
 * leaf inventing its own link shape.
 */

export const DEFAULT_PAGE_SIZE = 24;
const DEFAULT_WINDOW = 3;

export type PageLink = Readonly<{
  page: number;
  href: string;
  isCurrent: boolean;
}>;

export type Pagination = Readonly<{
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  pages: readonly PageLink[];
  previousHref: string | null;
  nextHref: string | null;
  lastPageHref: string;
  /**
   * The requested page is past the end. Serving an empty grid on page 40 of 3
   * looks like a broken catalogue, so the route is told rather than left to
   * infer it from a zero-length result.
   */
  isOutOfRange: boolean;
}>;

export type PaginationInput = Readonly<{
  total: number;
  pageSize?: number;
  /** Pages shown either side of the current one. */
  window?: number;
}>;

function hrefForPage(
  locale: string,
  query: CatalogueQuery,
  page: number,
): string {
  return catalogueHref(locale, { ...query, page });
}

export function buildPagination(
  locale: string,
  query: CatalogueQuery,
  input: PaginationInput,
): Pagination {
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const window = input.window ?? DEFAULT_WINDOW;

  // Zero results is a ready page with an empty state, so page one always exists.
  const pageCount = Math.max(1, Math.ceil(input.total / pageSize));
  const isOutOfRange = query.page > pageCount;
  const current = Math.min(query.page, pageCount);

  const span = window * 2 + 1;
  const width = Math.min(span, pageCount);
  // Keep the window full at the edges rather than letting it shrink, so the
  // control does not change size as someone pages through.
  const start = Math.min(
    Math.max(DEFAULT_PAGE, current - window),
    Math.max(DEFAULT_PAGE, pageCount - width + 1),
  );

  const pages: PageLink[] = [];
  for (let page = start; page < start + width; page += 1) {
    pages.push({
      page,
      href: hrefForPage(locale, query, page),
      isCurrent: page === current,
    });
  }

  return {
    page: current,
    pageCount,
    pageSize,
    total: input.total,
    pages,
    previousHref:
      current > DEFAULT_PAGE ? hrefForPage(locale, query, current - 1) : null,
    nextHref:
      current < pageCount ? hrefForPage(locale, query, current + 1) : null,
    lastPageHref: hrefForPage(locale, query, pageCount),
    isOutOfRange,
  };
}
