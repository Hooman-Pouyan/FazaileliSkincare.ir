import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface DisclosureSection {
  key: string;
  title: string;
  body: React.ReactNode;
}

/**
 * PDP progressive disclosure. Accordion, never tabs — tabs hide content from
 * crawlers and from a reader who is simply scrolling.
 *
 * `اصالت کالا` is included as a slot even before IRC codes are decided, so
 * filling it in later needs no schema or layout change.
 */
export function ProductDisclosure({
  sections,
}: {
  sections: DisclosureSection[];
}) {
  return (
    <Accordion
      type="multiple"
      defaultValue={[sections[0]?.key ?? ""]}
      className="w-full"
    >
      {sections.map((s) => (
        <AccordionItem key={s.key} value={s.key}>
          <AccordionTrigger>{s.title}</AccordionTrigger>
          <AccordionContent>{s.body}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function buildDefaultSections(p: {
  ingredients?: string | null;
  usage?: string | null;
  suitableFor?: string | null;
  ircCode?: string | null;
}): DisclosureSection[] {
  const out: DisclosureSection[] = [];
  if (p.ingredients)
    out.push({
      key: "ingredients",
      title: "ترکیبات کلیدی",
      body: p.ingredients,
    });
  if (p.usage) out.push({ key: "usage", title: "روش استفاده", body: p.usage });
  if (p.suitableFor)
    out.push({ key: "suitable", title: "برای چه پوستی", body: p.suitableFor });
  out.push({
    key: "authenticity",
    title: "اصالت کالا",
    body: p.ircCode
      ? `کد IRC: ${p.ircCode}`
      : "کد اصالت این محصول به‌زودی در همین بخش درج می‌شود.",
  });
  return out;
}
