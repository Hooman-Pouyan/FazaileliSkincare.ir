import type { ReactNode } from "react";

/**
 * One visual anatomy for every route state, without flattening what they mean.
 *
 * `SHELL-06` asks for shared appearance and distinct meaning, so the shape is
 * common and the words are not: a valid empty result, a missing entity, an
 * untranslated page and a database outage each say their own thing and offer
 * their own way forward.
 */
export function RouteState({
  title,
  body,
  action,
  reference,
}: {
  readonly title: string;
  readonly body: string;
  readonly action?: ReactNode;
  readonly reference?: string;
}) {
  return (
    <section className="mx-auto grid max-w-[38rem] gap-6 px-6 py-24 text-center lg:py-32">
      <h1 className="m-0 text-balance text-[length:var(--text-h2)] font-black leading-[1.35] text-[color:var(--ink)]">
        {title}
      </h1>
      <p className="m-0 text-[length:var(--text-body)] leading-[1.9] text-[color:var(--stone-text)]">
        {body}
      </p>
      {action ? <div className="grid justify-center">{action}</div> : null}
      {reference ? (
        <p className="m-0 text-[length:var(--text-micro)] text-[color:var(--stone-text)]">
          <span dir="ltr">{reference}</span>
        </p>
      ) : null}
    </section>
  );
}
