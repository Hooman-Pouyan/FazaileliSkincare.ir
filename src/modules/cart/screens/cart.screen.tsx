import { useTranslations } from "next-intl";
import { Container } from "@/components/layout/container";
import { Link } from "@/i18n/navigation";
import type { CartOutcome } from "../models/cart-models";
import { CartLineList } from "../components/cart-lines";

/**
 * `/cart` — the mobile-primary cart, and the shareable one.
 *
 * **Server-rendered, and deliberately not a Query consumer.** The route reads
 * the cart and passes it in; the controls are forms whose Server Actions
 * revalidate the route. That loop needs no client cache and works with
 * JavaScript off.
 *
 * The first version of this did subscribe to Query, and it was wrong in a way
 * worth recording: a form action refreshed the *server* render while the screen
 * kept reading a cache seeded once at mount, so removing a line changed nothing
 * on screen. Two owners for one fact — the failure `data-and-state-ownership.md`
 * is written to prevent, reached from the direction of adding a cache rather
 * than adding a copy. Query's approved consumer is the drawer, which has no
 * server render to inherit; this page has one.
 *
 * The route beneath it is a real URL: reloadable, shareable and back-button
 * correct, which `CART-05` requires and a drawer alone cannot give.
 *
 * **No checkout action.** Not a disabled one either — `CART-05` refuses a dead
 * button. The sentence saying checkout is not open is the honest version, and
 * it is the only thing here that will change when the transaction programme
 * opens.
 */
export function CartScreen({ cart }: { readonly cart: CartOutcome }) {
  const t = useTranslations("cart");

  const lines = cart.kind === "ready" ? cart.page.lines : [];
  const summary = cart.summary;

  return (
    <main>
      <Container className="pt-14 pb-[var(--space-9)]">
        <h1 className="m-0 text-h1 font-bold leading-fa">{t("title")}</h1>

        {lines.length === 0 ? (
          <div className="flex flex-col items-start gap-4 pt-10">
            <p className="m-0 text-lede font-light">{t("empty.title")}</p>
            <p className="m-0 text-body text-stone-text">{t("empty.body")}</p>
            <Link
              href="/shop"
              className="mt-2 inline-flex min-h-11 items-center border-b border-[color:var(--gold)] pb-1 text-small font-medium"
            >
              {t("empty.action")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 pt-10 lg:grid-cols-[6fr_4fr] lg:gap-[var(--space-8)]">
            <CartLineList lines={lines} mode="page" />

            <aside className="flex h-fit flex-col gap-4 rounded-[var(--radius-surface)] bg-linen p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-small text-stone-text">
                  {t("subtotal")}
                </span>
                {summary?.subtotal && (
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-h3 font-medium tabular-nums">
                      {summary.subtotal.label}
                    </span>
                    <span className="text-small font-light text-stone-text">
                      {t("currency")}
                    </span>
                  </span>
                )}
              </div>

              <p className="m-0 text-small leading-fa text-stone-text">
                {t("checkoutPending")}
              </p>
            </aside>
          </div>
        )}
      </Container>
    </main>
  );
}
