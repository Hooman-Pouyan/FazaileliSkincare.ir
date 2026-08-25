import { getTranslations } from "next-intl/server";

/**
 * Deliberately quiet. A skeleton that guesses at a layout it does not know is
 * worse than a line of text: it promises a shape the real page may not have.
 */
export default async function Loading() {
  const t = await getTranslations("states");

  return (
    <p
      role="status"
      aria-live="polite"
      className="px-6 py-24 text-center text-[length:var(--text-body)] text-[color:var(--stone-text)]"
    >
      {t("loading")}
    </p>
  );
}
