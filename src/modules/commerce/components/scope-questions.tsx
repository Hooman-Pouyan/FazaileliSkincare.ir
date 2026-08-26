import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "@/components/layout/reveal";
import type { ScopeQuestion } from "../models/page-models";

/**
 * Questions this scope answers, in her voice.
 *
 * This is the strongest ranking asset a concern page can carry: a question
 * people actually type, answered by someone qualified to answer it. It also
 * does the job a listing otherwise cannot — a shopper who does not yet know
 * what to buy needs an answer, not a grid.
 *
 * An accordion rather than tabs, per `10-design-playbook.md`: *"Never tabs; tabs
 * hide content from crawlers and from a scrolling reader."* Every answer is in
 * the server-rendered HTML whether its panel is open or not.
 *
 * Renders nothing when there are no questions, which is the state it ships in —
 * `FAQPage` markup is emitted by the route from this same array, so structured
 * data cannot claim a question the page does not show.
 */
export function ScopeQuestions({
  questions,
}: {
  readonly questions: readonly ScopeQuestion[];
}) {
  const t = useTranslations("plp");

  if (questions.length === 0) return null;

  return (
    <Reveal as="section" className="flex flex-col gap-8">
      <h2 className="text-h2 font-bold">{t("questionsTitle")}</h2>

      <Accordion type="multiple" className="max-w-[52em]">
        {questions.map((entry) => (
          <AccordionItem key={entry.question} value={entry.question}>
            <AccordionTrigger className="text-start text-lede font-medium">
              {entry.question}
            </AccordionTrigger>
            {/*
              `forceMount` keeps every answer in the document whether its panel
              is open or not. Radix unmounts closed content by default, which
              would put the answers out of reach of a crawler — the same failure
              `10-design-playbook.md` gives as the reason PDP disclosure is
              never tabs. Google explicitly permits FAQ content behind an
              accordion; it does not permit content that is not there.
            */}
            <AccordionContent
              forceMount
              className="text-body leading-fa text-stone-text data-[state=closed]:hidden"
            >
              {entry.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Reveal>
  );
}
