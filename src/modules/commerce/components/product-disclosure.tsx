import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ProductDisclosureSection } from "../models/page-models";

/**
 * «جزئیات محصول» — what is in it, how to use it, who it suits, and whether it
 * is genuine. `PDP-07`.
 *
 * **An accordion, never tabs.** `10-design-playbook.md` gives the reason and it
 * is not aesthetic: tabs hide content from crawlers and from a reader who is
 * simply scrolling. `forceMount` with `data-[state=closed]:hidden` follows
 * `ScopeQuestions` exactly, so every section is in the server-rendered document
 * whether its panel is open or not — which is what `PDP-07` means by *"server
 * rendered and available to crawlers/assistive technology"*, and what makes the
 * page correct with JavaScript off.
 *
 * The **order is fixed** and comes from the design system: ingredients, usage,
 * suitability, authenticity — «اصالت کالا» always last. The read supplies only
 * the sections that have something in them, so no heading opens onto nothing.
 *
 * «اصالت کالا» carries an IRC code when one exists and is otherwise absent. The
 * design system's own component fills it with «به‌زودی … درج می‌شود» instead,
 * and that sentence is a promise about the maintainer's business on a timeline
 * nobody agreed. Structure now, claim never.
 */
const ORDER: readonly ProductDisclosureSection["key"][] = [
  "ingredients",
  "usage",
  "suitableFor",
  "authenticity",
];

export function ProductDisclosure({
  sections,
}: {
  readonly sections: readonly ProductDisclosureSection[];
}) {
  const t = useTranslations("pdp");
  if (sections.length === 0) return null;

  const ordered = [...sections].sort(
    (a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key),
  );

  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-h3 font-bold">{t("disclosure.title")}</h2>

      <Accordion type="multiple" className="max-w-[52em]">
        {ordered.map((section) => (
          <AccordionItem key={section.key} value={section.key}>
            <AccordionTrigger className="text-start text-lede font-medium">
              {t(`disclosure.${section.key}`)}
            </AccordionTrigger>
            <AccordionContent
              forceMount
              className="text-body leading-fa text-stone-text data-[state=closed]:hidden"
            >
              {section.key === "authenticity" ? (
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="text-micro uppercase tracking-[0.13em] text-gold-text">
                    {t("disclosure.ircLabel")}
                  </span>
                  <span className="font-medium tabular-nums text-ink">
                    {section.body}
                  </span>
                </span>
              ) : (
                section.body
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
