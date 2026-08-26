import { useTranslations } from "next-intl";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { EditorialBand } from "@/components/content/editorial-band";
import { GalleryBand } from "@/components/content/gallery-band";
import { Divider } from "@/components/brand/divider";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { Reveal } from "@/components/layout/reveal";
import { Link } from "@/i18n/navigation";
import { AppliedFilters, FacetRail } from "../components/facet-rail";
import { ListingToolbar, Pagination } from "../components/listing-toolbar";
import { PriceFilter } from "../components/price-filter";
import { ProductTile } from "../components/product-tile";
import { ScopeQuestions } from "../components/scope-questions";
import type { ProductListingPage } from "../models/page-models";

/**
 * One screen for every listing: concern, brand, category and search.
 *
 * They differ only in their scope, which the page model already resolved into a
 * title, an introduction and a breadcrumb trail. Four screens that differ by a
 * heading would be four places to fix the same bug.
 *
 * Layout is a facet rail beside a borderless grid — `10-design-playbook.md`
 * template 3. The rail is a plain column on mobile, below the results, because
 * a drawer that has to open before a customer can see what is filterable hides
 * the site's main competitive advantage behind a tap.
 */
export function ProductListingScreen({
  page,
}: {
  readonly page: ProductListingPage;
}) {
  const t = useTranslations("plp");
  const isSearch = page.scope.kind === "search";

  // Placement is by kind, not by author: a campaign and an intro belong above
  // the results where they frame them, a gallery below where it does not push
  // the grid down the page.
  const leadBands = page.bands.filter((band) => band.kind !== "gallery");
  const galleries = page.bands.filter((band) => band.kind === "gallery");

  return (
    <main>
      <Container className="pt-14">
        <Breadcrumbs items={page.breadcrumbs} />

        {leadBands.length > 0 && (
          <div className="flex flex-col gap-6 pt-6">
            {leadBands.map((band) => (
              <EditorialBand
                key={band.key}
                heading={band.heading}
                body={band.body}
                cta={band.cta}
                tone={band.kind === "campaign" ? "accented" : "plain"}
              />
            ))}
          </div>
        )}

        <Reveal className="flex flex-col gap-4 pt-6 pb-10">
          <h1 className="max-w-[20ch] text-h1 font-black leading-[1.28] text-balance">
            {page.scope.title}
          </h1>
          {page.scope.introduction && (
            <p className="max-w-[42em] text-lede leading-fa font-light text-stone-text">
              {page.scope.introduction}
            </p>
          )}
        </Reveal>
      </Container>

      <Container className="grid items-start gap-12 pb-24 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16">
        <div className="order-2 flex flex-col gap-10 lg:order-1">
          <FacetRail page={page} />
          {page.price && <PriceFilter price={page.price} />}
        </div>

        <div className="order-1 flex flex-col gap-6 lg:order-2">
          <ListingToolbar page={page} />
          <AppliedFilters page={page} />

          {page.results.length === 0 ? (
            <EmptyState
              title={isSearch ? t("empty.searchTitle") : t("empty.title")}
              body={isSearch ? t("empty.searchBody") : t("empty.body")}
              action={
                page.clearFiltersHref ? (
                  <Link
                    href={page.clearFiltersHref}
                    className="border-b border-firouzeh-text pb-1 text-small font-medium text-firouzeh-text"
                  >
                    {t("clearFilters")}
                  </Link>
                ) : (
                  <Link
                    href="/shop"
                    className="border-b border-firouzeh-text pb-1 text-small font-medium text-firouzeh-text"
                  >
                    {t("empty.action")}
                  </Link>
                )
              }
            />
          ) : (
            <Reveal
              as="ul"
              stagger
              step={45}
              className="grid grid-cols-2 gap-x-6 gap-y-14 pt-2 lg:grid-cols-3"
            >
              {page.results.map((product) => (
                <li key={product.slug}>
                  <ProductTile
                    product={product}
                    enquiryHref={t("enquiryHref")}
                  />
                </li>
              ))}
            </Reveal>
          )}

          <Pagination page={page} />
        </div>
      </Container>

      {galleries.length > 0 && (
        <Container className="flex flex-col gap-16 pb-24">
          <Divider />
          {galleries.map((band) => (
            <GalleryBand
              key={band.key}
              heading={band.heading}
              entries={band.items}
              label={t("gallery.label")}
              previousLabel={t("gallery.previous")}
              nextLabel={t("gallery.next")}
            />
          ))}
        </Container>
      )}

      {page.questions.length > 0 && (
        <Container className="flex flex-col gap-16 pb-24">
          {/*
            One Divider on this page at most, and the gallery above already
            spent it when there is one — `DS-4` caps the ornament at twice per
            page and two in a row would be furniture rather than punctuation.
          */}
          {galleries.length === 0 && <Divider />}
          <ScopeQuestions questions={page.questions} />
        </Container>
      )}
    </main>
  );
}
