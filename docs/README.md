# Documentation index

Written before code, deliberately. Every decision here has a stated reason and a stated cost — where a choice was later reversed, the reversal and its trigger are recorded rather than quietly edited out.

| Doc | What it settles |
|---|---|
| [`00-decision-map.md`](00-decision-map.md) | **Start here.** Decisions, deferrals, open questions, phased plan, and the three things most likely to go wrong |
| [`01-adr-001-stack.md`](01-adr-001-stack.md) | Next.js 16.3 vs TanStack Start · Drizzle vs TypeORM vs Prisma · shadcn vs Ant Design · the wall between this project and coordeck |
| [`02-adr-002-infrastructure.md`](02-adr-002-infrastructure.md) | Liara vs ParsPack vs Darkube vs ArvanCloud · bank transfer and ZarinPal · sanctions-safe builds · backups, TLS, secrets, logging |
| [`03-domain-model.md`](03-domain-model.md) | Bounded contexts and their boundaries · entities and invariants · the EN/FA ubiquitous language |
| [`04-information-architecture.md`](04-information-architecture.md) | The rail-and-rooms shell · the five surfaces · the palette sampled from the institute, with measured contrast · RTL rules |
| [`05-paperwork-playbook.md`](05-paperwork-playbook.md) | The non-technical track: company file, business licence, eNamad, ZarinPal, tax e-invoicing — in sequence, runnable in parallel |

## The three decisions most expensive to reverse

1. **Integer rials stored, Toman displayed** — the most common money bug in Iranian ecommerce.
2. **UTC stored, Jalali rendered** — storing Shamsi is a trap.
3. **httpOnly server-owned sessions** — a storefront handling payments cannot keep tokens in `localStorage`.

## Still open

Listed at the end of `00-decision-map.md` and `03-domain-model.md`. The two with the longest lead time are the **product and price list** and the **terms / privacy / returns** decisions — both are the owner's to make, not the developer's to invent.
