import { useTranslations } from "next-intl";
import { Container, Section } from "@/components/layout/container";
import { EmptyState } from "@/components/layout/empty-state";
import { Reveal } from "@/components/layout/reveal";
import { ScrollRail } from "@/components/layout/scroll-rail";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  AuthenticityBand,
  BrandList,
  CategoryLinks,
  ConcernTiles,
  SectionHeading,
} from "../components/hub-sections";
import { HubHero } from "../components/hub-hero";
import { ProductTile } from "../components/product-tile";
import type { ShopHubPage } from "../models/page-models";

/**
 * The Shop's front door. Concern first, brand second, type third — the order in
 * `docs/04-information-architecture.md` §1, and the gap the competitive research
 * found: the dominant Iranian vendor has no concern axis at all.
 *
 * This is the Shop hub and only the Shop hub. Brand storytelling, the academy,
 * booking and testimonials belong to the Landing, per decision L-1. The one
 * exception is the authenticity band, which is not storytelling: counterfeit
 * anxiety is a *purchase* objection, and answering it belongs where the buying
 * happens.
 *
 * Every section renders from the page model or does not render at all. There is
 * no placeholder section and no "coming soon" — an axis with nothing behind it
 * is a dead end dressed as a choice.
 *
 * Rhythm: ground → ground → lapis → surface → ground → ground. The dark band
 * lands in the middle, which is the alternation `docs/09-brand-brief.md` asks
 * for and the only field where gold and champagne pass contrast.
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
      <main className="ms-14">
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
    <main className="ms-14">
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
              title={t("featured.title")}
              lede={t("featured.lede")}
            />
            <ScrollRail
              label={t("featured.railLabel")}
              previousLabel={t("rail.previous")}
              nextLabel={t("rail.next")}
              itemClassName="[&>li]:w-[68vw] sm:[&>li]:w-[42vw] lg:[&>li]:w-[23rem]"
            >
              {page.featured.map((product, index) => (
                <Reveal
                  as="li"
                  key={product.slug}
                  delay={Math.min(index, 3) * 60}
                >
                  <ProductTile
                    product={product}
                    enquiryHref={t("enquiryHref")}
                    priority={index < 2}
                  />
                </Reveal>
              ))}
            </ScrollRail>
          </Container>
        </Section>
      )}

      <Section tone="lapis">
        <Container>
          <AuthenticityBand />
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
