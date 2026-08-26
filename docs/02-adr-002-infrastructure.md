# ADR-002 — Hosting, payments and deployment (Iran)

**Status:** Proposed
**Date:** 2026-08-24

---

## Context

You said: Iran-hosted, Iranian gateway. That single answer eliminates most of the industry's default infrastructure and creates a small set of hard constraints that shape everything else.

**The constraints, stated plainly:**

1. **Foreign clouds are out — practically and legally.** Vercel, Netlify, AWS, Azure, GCP and Cloudflare's paid tiers restrict or block Iranian accounts and traffic under US sanctions. Building on them means your account can vanish without notice and your customers may not be able to reach the site. This is not a risk to manage; it's a door that's closed.
2. **A rial payment gateway effectively requires Iranian hosting.** PSPs and the eNamad process expect an Iranian-hosted site on an Iranian IP. A `.ir` domain on a foreign host is the wrong shape for the paperwork.
3. **Your build machine may not be able to reach npm, Docker Hub or GitHub.** Iranian IPs are intermittently blocked by package registries. This breaks CI _silently and at the worst moment_. It needs a designed answer, not a workaround discovered under pressure.

---

## Decision — Start on **Liara**, keep an ArvanCloud exit

You named Liara, and it's the right instinct. For your situation it's the closest thing to "Vercel, but legal and local."

### The options, honestly compared

| Option                                   | What it is                                                                                                                                                                                                                                                                 | Fit for you                                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Liara**                                | Iranian PaaS. CLI push, managed PostgreSQL, S3-compatible object storage, DNS, free SSL, persistent disks. Rial billing, hourly.                                                                                                                                           | Best developer experience of the Iranian options — closest thing to "Vercel, but legal and local."                                                                                                    |
| **ParsPack PaaS**                        | Iranian PaaS from an older, larger hosting company. Deploy from Docker, code upload or webhook CI. Managed PostgreSQL/Redis/Mongo/Elastic, MinIO object storage, scheduled + on-demand backups with rollback. **Datacenters in Iran _and_ Germany.** Hourly pay-as-you-go. | Equally strong. Edges ahead on vendor durability and on the Germany region if you ever want an English-market front.                                                                                  |
| **Darkube (Hamravesh)**                  | Kubernetes-native Iranian PaaS.                                                                                                                                                                                                                                            | Capable, but more Kubernetes than a solo maintainer needs. Consider only if you end up wanting k8s primitives.                                                                                        |
| **ArvanCloud**                           | The largest Iranian cloud: VMs, Kubernetes, object storage, national CDN, **VOD platform**, container registry.                                                                                                                                                            | **The exit ramp, and the answer for media.** More knobs than you need for the app itself — but its CDN and VOD are the natural home for product imagery and course video no matter who hosts the app. |
| **Plain Iranian VPS** (IranServer, etc.) | A Linux box.                                                                                                                                                                                                                                                               | Cheapest per GB, most work. You'd own Postgres backups, TLS renewal, patching, log rotation. Wrong place for a solo operator's hours when a payment flow is running.                                  |
| **Vercel / Netlify**                     | —                                                                                                                                                                                                                                                                          | Not viable. Sanctions.                                                                                                                                                                                |
| **Neon / Supabase / PlanetScale**        | Managed Postgres/MySQL                                                                                                                                                                                                                                                     | Not viable — US-owned, no region near Iran. Even if reachable, every query crossing to Frankfurt is fatal for a checkout.                                                                             |
| **Hetzner / foreign VPS**                | Cheap, capable                                                                                                                                                                                                                                                             | Slow from Iran, complicates eNamad and the gateway, and Iranian PSP callbacks to foreign IPs are unreliable.                                                                                          |

### The decision: race them, don't reason about them

Liara and ParsPack are both correct answers and I can't separate them from a desk. Both treat **Next.js as a named, documented platform** — Liara publishes a dedicated `nextjs` docs tree alongside its generic `nodejs` one — so the comparison is cheap and empirical rather than architectural:

> Deploy a hello-world to both. Both bill hourly, so it costs pennies. Compare deploy friction, log quality, managed-Postgres setup, and TTFB from Tehran. Commit to the winner with evidence.

That test is real precisely _because_ nothing in the stack is platform-specific. Portability is the actual decision here; the vendor name is a detail you can settle in an afternoon.

### Recommended shape

```
  fazaieli.ir  ─┬─►  Liara app (Next.js standalone container)
                │        └─ env: DATABASE_URL, ZARINPAL_MERCHANT_ID, SMS_KEY, …
                ├─►  Liara managed PostgreSQL 16   (daily automated backup + weekly off-platform dump)
                ├─►  Object storage (Liara or ArvanCloud, S3 API)  — product images, course PDFs
                ├─►  ArvanCloud CDN in front of static + media
                └─►  ArvanCloud VOD                — course video only (Phase 4)
```

Everything above speaks standard protocols — S3 API, Postgres wire protocol, a Docker container. **Nothing is Liara-specific.** If Liara disappoints on price or reliability, moving to an ArvanCloud VM is a weekend, not a rewrite. That portability is the actual decision here; "Liara" is just where it starts.

---

## Decision — Payments: **bank transfer from day one**, ZarinPal behind an interface

### The launch no longer waits for the gateway

The original plan made eNamad and PSP approval a hard gate on taking money. It doesn't have to be. **Direct bank transfer (کارت به کارت / واریز) ships as a first-class payment method**, so the shop opens with real orders while the paperwork runs in the background. That single decision removes the largest schedule risk in the project.

Both methods sit behind the same `PaymentMethod` abstraction and converge on **one settlement path** — stock decrement, order transition, SMS — with two entrances. Adding ZarinPal later is a configuration change plus a merchant ID, not a rewrite of checkout.

The mechanics, the fraud rule, and the reservation invariants are in the domain model. The two that matter most here:

- ⚠️ **A customer-uploaded receipt is a claim, not proof.** Only a staff member matching the real bank statement confirms an order. This is the one place the site could be defrauded at scale, and no amount of clever image handling changes that.
- ⚠️ **Use the company bank account.** Sustained card-to-card volume into a personal account is a known tax flag in Iran and complicates the Taxpayer System question rather than avoiding it. See the paperwork playbook.

### ZarinPal, once it lands

### The paperwork is the long pole, and it starts now

This is the part that will delay your launch if it isn't started this week:

1. **Domain** registered to the business/person at an Iranian registrar (IRNIC).
2. **eNamad (نماد اعتماد الکترونیکی)** — the trust seal. Requires identity documents, a matching phone number, the site live on an Iranian host with visible contact and terms pages. Weeks, not days.
3. **A PSP relationship** — ZarinPal is the low-friction path (individual or business onboarding, no bank branch visit for the basic tier). A direct bank PSP (Sadad / Behpardakht / Saman / Asan Pardakht) gives lower fees and more credibility but wants a registered company and takes longer.
4. **Samandehi (ساماندهی)** where applicable for content.

> **Action for you, not for me:** start eNamad and ZarinPal onboarding in parallel with development. Code finished before paperwork means a finished site that cannot take money.

### Integration pattern (non-negotiable details)

The merchant-terminal contract must be captured from the current ZarinPal documentation and the capabilities enabled for the real terminal during COM5. The familiar merchant REST v4 flow is request → redirect with `authority` → callback → server-side verify → `ref_id`; current ZarinPal account/invoice/refund documentation also exposes GraphQL at `/api/v4/graphql`. The adapter implements the contract actually issued to this merchant and records its version; application settlement never depends on which provider transport is selected.

The rules that keep you out of trouble:

- **Amount is computed server-side from the cart at request time.** Never from a form field.
- The provider session/authority is stored with a unique constraint and linked to exactly one payment and order. The callback is idempotent — a customer refreshing the return page must not create a second verification or a second stock decrement.
- **Server-to-server verify is the source of truth**, not the callback query string. For REST v4, `Status=OK` means nothing until verify returns code `100`; code `101` is the idempotent already-verified success. Equivalent success/already-processed states must be contract-tested if the terminal uses another current API.
- **Stock is decremented inside the same transaction as the successful verify**, not when the item is added to the cart. Cart items hold a soft reservation with a TTL instead.
- **Every gateway call and response is written to a `payment_events` table** before anything else happens. When a customer says "my money was taken", that table is your only defence.
- Payment request and verification sit behind one `PaymentGateway` interface with `request()` / `verify()`. V1 refunds are issued through the real banking/gateway channel and then recorded idempotently by staff; an automated `refund()` adapter is added only after an approved provider contract proves that capability. Swapping ZarinPal for a bank PSP later replaces the adapter, not the settlement transaction.

---

## Decision — Build and deploy despite registry blocking

The failure mode: `npm ci` on an Iranian runner times out against `registry.npmjs.org`, and you can't ship a hotfix.

**Design the answer in week 1, before you need it:**

- Pin an Iranian/neutral npm mirror in `.npmrc` (ArvanCloud and several Iranian providers run one) with the public registry as fallback.
- Commit the lockfile and **build a Docker image, don't build on the server.** The image is the artifact; push it to an Iranian container registry.
- Keep a documented fallback: build the image on a machine with unrestricted access, push, deploy. Write this down in a runbook now while it's calm.
- **Self-host every font and asset.** `fonts.googleapis.com` is not reliably reachable and Next.js will hard-fail a build that tries. Vazirmatn/Estedad (FA) and your Latin faces ship in `/public/fonts`.
- No CDN-loaded JS from foreign hosts anywhere in the app.

---

## Decision — Operational floor (day one, not later)

|                 |                                                                                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backups**     | Managed daily snapshot **plus** a nightly `pg_dump` pulled to storage you control, in a different provider. Test a restore once before launch. A backup you've never restored is a rumour. |
| **TLS**         | Managed Let's Encrypt via the platform; verify auto-renewal actually fires.                                                                                                                |
| **Secrets**     | Platform env vars only. Never in the repo. Rotate the gateway merchant ID if it's ever pasted anywhere.                                                                                    |
| **Logs/errors** | Self-hosted GlitchTip (Sentry-compatible) or the platform's log stream. Foreign SaaS error trackers will block you.                                                                        |
| **Analytics**   | Self-hosted Umami or Plausible. Google Analytics is both blocked and a poor fit.                                                                                                           |
| **Health**      | One `/api/health` endpoint that touches the DB, watched by an Iranian uptime service.                                                                                                      |

---

## Consequences

- Costs are in rials and modest; the real cost is video bandwidth in Phase 4, which is why VOD is a separate decision.
- You are dependent on a small number of Iranian providers with less redundancy than a hyperscaler. Mitigated by keeping everything on standard protocols and holding your own backups.
- **Launch date is gated by eNamad and PSP approval, not by code.** Plan around that.
