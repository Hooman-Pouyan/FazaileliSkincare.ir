import { useTranslations } from "next-intl";
import { Container, Rule, Section } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Link } from "@/i18n/navigation";
import {
  BrandList,
  CategoryLinks,
  ConcernTiles,
  SectionHeading,
} from "../components/hub-sections";
import { ProductGrid, ProductTile } from "../components/product-tile";
import type { ShopHubPage } from "../models/page-models";

/**
 * The Shop's front door. Concern first, brand second, type third — the order in
 * `docs/04-information-architecture.md` §1, and the gap the competitive research
 * found: the dominant Iranian vendor has no concern axis at all.
 *
 * This is the Shop hub and only the Shop hub. Brand storytelling, the academy,
 * booking and testimonials belong to the Landing, per decision L-1; mixing them
 * in here would push the concern tiles below the fold and flatten the rooms the
 * shell exists to keep separate.
 *
 * Every section renders from the page model or does not render at all. There is
 * no placeholder section and no "coming soon": an axis with nothing behind it is
 * a dead end dressed as a choice.
 */
export function ShopHubScreen({ page }: { page: ShopHubPage }) {
  const t = useTranslations("shop");

  const hasNothing =
    page.concerns.length === 0 &&
    page.brands.length === 0 &&
    page.categories.length === 0 &&
    page.featured.length === 0;

  if (hasNothing) {
    return (
      <main className="ms-14">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
        <Container>
          <EmptyState
            title={t("empty.title")}
            body={t("empty.body")}
            action={
              <Link
                href="/"
                className="border-b border-firouzeh-text pb-1 text-small font-medium text-firouzeh-text"
              >
                {t("empty.action")}
              </Link>
            }
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="ms-14">
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} lede={t("lede")} />

      {page.concerns.length > 0 && (
        <Section>
          <Container>
            <SectionHeading
              title={t("concerns.title")}
              lede={t("concerns.lede")}
            />
            <ConcernTiles concerns={page.concerns} />
          </Container>
        </Section>
      )}

      {page.featured.length > 0 && (
        <Section tone="surface">
          <Container>
            <SectionHeading title={t("featured.title")} />
            <ProductGrid>
              {page.featured.map((product, index) => (
                <ProductTile
                  key={product.slug}
                  product={product}
                  enquiryHref={t("enquiryHref")}
                  priority={index < 4}
                />
              ))}
            </ProductGrid>
          </Container>
        </Section>
      )}

      {page.brands.length > 0 && (
        <Section>
          <Container>
            <SectionHeading title={t("brands.title")} lede={t("brands.lede")} />
            <BrandList brands={page.brands} />
          </Container>
        </Section>
      )}

      {page.categories.length > 0 && (
        <Section>
          <Container className="flex flex-col gap-8">
            <Rule tone="soft" />
            <SectionHeading title={t("categories.title")} />
            <CategoryLinks categories={page.categories} />
          </Container>
        </Section>
      )}
    </main>
  );
}
