import { useTranslations } from "next-intl";
import { Container, Section } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { Reveal } from "@/components/layout/reveal";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  AuthenticityBand,
  BrandList,
  CategoryLinks,
  ConcernSpotlights,
  ConcernTiles,
  EditorialMosaic,
  SectionHeading,
} from "../components/hub-sections";
import { HubHero } from "../components/hub-hero";
import { ProductSpotlight } from "../components/product-spotlight";
import type { ShopHubPage } from "../models/page-models";

/**
 * The Shop's front door. Concern first, brand second, type third.
 *
 * This is the Shop hub and only the Shop hub. Brand storytelling, the academy,
 * booking and testimonials belong to the Landing, per decision L-1. The
 * authenticity band is the one exception, and it is not storytelling:
 * counterfeit anxiety is a *purchase* objection, so it belongs where the buying
 * happens.
 *
 * Every section renders from the page model or does not render at all. There is
 * no placeholder section and no "coming soon" — an axis with nothing behind it
 * is a dead end dressed as a choice.
 *
 * Band rhythm: ink → ground → surface → ground → lapis → surface → ground →
 * ground → surface. The two dark fields land at the top and the middle, which is
 * the alternation `09-brand-brief.md` describes and the only ground where gold
 * and champagne pass contrast.
 */
export function ShopHubScreen({ page }: { readonly page: ShopHubPage }) {
  const t = useTranslations("shop");

  const hasNothing =
    page.concerns.length === 0 &&
    page.brands.length === 0 &&
    page.categories.length === 0 &&
    page.featured.length === 0;

  if (hasNothing) {
    return (
      <main>
        <HubHero />
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
    <main>
      <HubHero />

      {page.concerns.length > 0 && (
        <Section id="concerns" className="scroll-mt-8">
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
            <SectionHeading
              title={t("spotlight.title")}
              lede={t("spotlight.lede")}
            />
            <ProductSpotlight products={page.featured} />
          </Container>
        </Section>
      )}

      {page.concernSpotlights.length > 0 && (
        <Section>
          <Container>
            <SectionHeading
              title={t("spotlights.title")}
              lede={t("spotlights.lede")}
            />
            <ConcernSpotlights spotlights={page.concernSpotlights} />
          </Container>
        </Section>
      )}

      <Section tone="lapis">
        <Container>
          <AuthenticityBand />
        </Container>
      </Section>

      <Section tone="surface">
        <Container>
          <EditorialMosaic />
        </Container>
      </Section>

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
          <Container>
            <SectionHeading
              title={t("categories.title")}
              lede={t("categories.lede")}
            />
            <CategoryLinks categories={page.categories} />
          </Container>
        </Section>
      )}

      <Section tone="surface">
        <Container>
          <Reveal className="flex max-w-[40em] flex-col gap-5">
            <h2 className="text-h2 font-bold text-balance">
              {t("closing.title")}
            </h2>
            <p className="text-lede leading-fa font-light text-stone-text">
              {t("closing.body")}
            </p>
            <Button asChild size="lg" className="mt-2 w-fit">
              <a href={t("enquiryHref")}>{t("closing.action")}</a>
            </Button>
          </Reveal>
        </Container>
      </Section>
    </main>
  );
}
