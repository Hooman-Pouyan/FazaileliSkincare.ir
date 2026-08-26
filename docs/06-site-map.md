# Site map & page inventory

**Date:** 2026-08-24 · Answers: what exists now, what the full build is, and whether the account area is a separate application.

---

## What actually exists today

Five draft artboards. That is all — and it is roughly 8% of the pages below.

| Mocked             | Which page it is                                                          |
| ------------------ | ------------------------------------------------------------------------- |
| `Main.dc.html`     | Landing                                                                   |
| `Shop.dc.html`     | **A merged PHP + PLP** — the concern hub and the product grid on one page |
| `Product.dc.html`  | PDP                                                                       |
| `Checkout.dc.html` | Checkout, payment step only (bank transfer)                               |
| `Mobile.dc.html`   | Landing at 390px                                                          |

Not yet drawn: cart, the address and shipping steps, every account page, all of Booking, all of Academy, the whole admin, and every legal page.

---

## PHP / PLP / PDP — yes, and one correction

Your taxonomy is right, but I merged PHP and PLP in the mock and **that was the wrong call.** Separating them:

| Page               | Route                                                                | Why it exists separately                                                            |
| ------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **PHP** — shop hub | `/shop`                                                              | Editorial: concerns, brands, curated routines, new arrivals. The room's front door. |
| **PLP** — listing  | `/shop/concern/[slug]` · `/shop/brand/[slug]` · `/shop/c/[category]` | One real URL per concern, brand and category                                        |
| **PDP** — detail   | `/shop/p/[slug]`                                                     |                                                                                     |

**The reason is Persian SEO, and it's decisive.** Someone searching «سرم ویتامین سی» or «کرم ضدلک» must land on a page that is _about_ that thing — with its own URL, title, description and structured data. A single page that filters client-side has one URL and can rank for one query. With ~5 concerns × 3 brands × 8 categories you are giving up dozens of entry points to keep one clever interaction.

The concern selector stays on the hub — it just navigates instead of filtering in place.

---

## Full inventory

### Brand & legal — Phase 1

`/` landing · `/about` دربارهٔ مهدیه فضائلی · `/results` قبل و بعد · `/contact` تماس و نشانی

⚠️ **Required before eNamad will certify the domain:** `/terms` قوانین و مقررات · `/privacy` حریم خصوصی · `/returns` شرایط مرجوعی و بازگشت وجه. These are commitments you make, not text I can invent.

Later: `/faq` · `/journal` مقالات (Persian SEO, Phase 5)

### Shop — Phase 2

`/shop` PHP · `/shop/concern/[slug]` · `/shop/brand/[slug]` · `/shop/c/[category]` · `/shop/p/[slug]` PDP · `/shop/search`

**Purchase flow:** `/cart` (a drawer on desktop, a real page on mobile — it needs a URL either way) · `/checkout` address → shipping → payment · `/checkout/transfer/[orderId]` transfer instructions and the claim form · `/order/[orderNumber]` confirmation and status, reachable by guests through a signed link · `/order/[orderNumber]/invoice` فاکتور, printable — **this is where the tax e-invoicing answer lands, so its data has to be right from order one**

### Account — `/account`

Your list, corrected in one place:

| Page                                                       | Route                                     | Phase |
| ---------------------------------------------------------- | ----------------------------------------- | ----- |
| Overview — next appointment, latest order, course progress | `/account`                                | 2     |
| Orders and their status                                    | `/account/orders` · `/account/orders/[n]` | 2     |
| Payments, invoices, **instalments**                        | `/account/payments`                       | 2     |
| Personal information                                       | `/account/profile`                        | 2     |
| Addresses                                                  | `/account/addresses`                      | 2     |
| Discounts and customer club                                | `/account/discounts`                      | 5     |
| Appointments                                               | `/account/appointments`                   | 3     |
| Skin profile ⚠️ health data                                | `/account/skin-profile`                   | 3     |
| My courses                                                 | `/account/courses`                        | 4     |
| Security — phone number, active sessions                   | `/account/security`                       | 2     |

> **There is no "change password" page, because there is no password.** Authentication is phone + OTP (D6), which Iranian users expect. What replaces it is _change phone number_ and _sign out other devices_ — and changing the phone number is a sensitive operation that needs OTP on both the old and new number.

### Booking — Phase 3

`/book` services · `/book/[service]` · `/book/[service]/schedule` Jalali slot picker · `/book/intake` · `/book/deposit` · `/book/confirm/[id]`

### Academy — Phase 4

`/academy` hub · `/academy/workshops` dated runs · `/academy/courses/[slug]` syllabus · `/academy/cohort/[id]` · `/academy/enroll/[id]` · `/certificate/[code]` **public verification**

Enrolled students get a different surface entirely — no marketing on it: `/learn/[courseId]` · `/learn/[courseId]/[lessonId]`

### Admin — `/admin`, from Phase 2

`/admin` today · `/admin/orders` · **`/admin/transfers`** ⭐ · `/admin/products` · `/admin/prices` bulk adjustment · `/admin/inventory` · `/admin/customers` · `/admin/content` ⭐ · `/admin/bookings` (3) · `/admin/academy` (4) · `/admin/settings`

⭐ **`/admin/transfers` is the screen your business runs on daily** once launch happens on bank transfer. It is a queue of orders awaiting payment, each showing its unique expected amount, matched against the bank statement, confirmed in one click. Design it properly — it is used more than any storefront page.

⭐ **`/admin/content`** is where before/after consent lives. Revocation must be one action.

### Auth

`/login` phone entry · `/verify` OTP

---

**That is roughly 60 pages.** Worth seeing plainly before committing to a timeline: Phase 2 alone is about 20 of them.

---

## Should the account area be a separate app or repo?

**No. One Next.js application, one repository, one database, one deploy.**

The instinct behind the question is right — the storefront and a dashboard should not _look_ the same. But that is a **layout** problem, not an **application** problem, and Next.js route groups solve it directly:

```
src/app/[locale]/
  (storefront)/    layout: the rail, full-bleed editorial
  (account)/       layout: a quieter sidebar, denser
  (admin)/         layout: a real dashboard — tables, filters, bulk actions
```

Three completely different visual worlds. One auth system, one schema, one deploy, one set of types.

**What splitting would actually cost you:** an API layer between the two apps that you don't need, session sharing across origins, CORS, two deploy pipelines, two sets of environment variables, and duplicated types — all maintained by one person. Every one of those is a permanent tax paid for a separation you can get from a folder.

And the account area is **read-mostly views over the same data the storefront already loads**. There is no boundary there worth defending.

> **On the admin looking like a dashboard:** it should. It _is_ one. The rule from AGENTS.md — "if a screen starts looking like an admin dashboard, it has gone wrong" — is about the **storefront**. `/admin` is exempt, and trying to make an order queue feel editorial would make it worse at its job.

**When splitting would become right:** a separate team owning admin, a different deploy cadence, or a different security posture — none of which is true now. And because the domain modules are already separated with no cross-imports, extracting later is a real option rather than a rewrite. That optionality is the reason to keep the boundaries clean, not a reason to split today.
