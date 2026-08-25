# Evidence — C3 trigram search index

**Date:** 2026-08-25 · **Closes:** review correction C3 (MEDIUM-3), `DB3` search gate
**Where it was run:** a disposable PostgreSQL 16.13 instance, migrations `0000`–`0003`
applied from the committed SQL. Not the maintainer's machine and not a deployed
environment — the point was to exercise the committed migrations from zero.

---

## What was proven

### The migrations apply cleanly from an empty database

All four applied with no errors: 49 tables, 148 indexes, 67 foreign keys, 41
check constraints, and `pg_trgm` installed. `CREATE EXTENSION pg_trgm` required
no special grant on a stock PostgreSQL 16, which settles the open question in
migration `0003`'s header — the DB7 deploy role needs nothing unusual for it.

The repository's `scripts/database-invariants.sql` runs clean against the result
up to its migration-ledger check, which fails only because the SQL was applied
with `psql` rather than through `drizzle-kit`, so `drizzle.__drizzle_migrations`
does not exist.

### C1 — an order now outlives its customer

The exact shape the review said would abort: a registered customer's order, with
`guest_phone` null.

```
before   has_person | guest_phone_null | contact_phone
         t          | t                | +989123456789

delete from person where id = …   →   DELETE 1

after    person_id | contact_phone
                   | +989123456789
```

The delete completes and the order survives, orphaned but still contactable.
Before migration `0002` this raised a check violation from inside the cascade.

### C2 — a settlement can no longer name the wrong order

```
payment A belongs to order A.

insert settlement (payment A, order A)  →  INSERT 0 1
insert settlement (payment A, order B)  →  ERROR: insert or update on table
  "payment_settlement" violates foreign key constraint
  "payment_settlement_payment_order_fk"
```

The transposed-variable bug the review described is now unrepresentable at the
database boundary rather than depending on `settleOrder` being written carefully.

---

## C3 — where the trigram index actually earns its place

This is the part worth reading, because the honest answer is more specific than
"the index works".

**The index is correct and usable.** With `enable_seqscan = off`, PostgreSQL
plans a `Bitmap Index Scan on product_translation_search_trgm_idx` with
`Index Cond: (normalized_search_text ~~ '%روشن%')`. `gin_trgm_ops` supports infix
`LIKE` over Persian text, which is the mechanism C3 depends on.

**Whether the planner chooses it depends on selectivity and table size**, as it
should. Measured on 100,000 `product_translation` rows:

| Query | Plan | Time | Buffers |
|---|---|---|---|
| Selective term, 1 row of 100,000 | **Bitmap Index Scan** on the trigram index | 2.1 ms | 181 |
| Broad term, 11,816 rows of 100,000 | Seq Scan | 16.3 ms | 1,345 |

For the selective query the same seq scan would cost 16 ms and 1,345 buffers, so
the index is an order of magnitude better and the planner takes it. For the broad
term, fetching 12% of the table through an index would be slower, and declining
it is the right call — not a failure.

At 5,000 rows the planner declines the index for every query, and that is also
correct: the whole table is 68 pages and scanning it costs less than the GIN
startup.

### What this means for the launch catalogue

A first catalogue of a few hundred products will seq-scan every search, in
microseconds, and the index will sit unused. That is the expected outcome and not
a reason to remove it — a customer searching a real product name is the selective
case, and the index becomes the difference the moment the catalogue is large
enough for it to matter.

**The gate to re-check:** when the catalogue passes roughly a thousand products,
re-run a representative Persian product-name search and confirm the plan has
flipped to the index. If it has not, the query shape is wrong — most likely a
leading wildcard on a column the index does not cover, or a query path that
forgot to call `normalizeCatalogSearchText` on its input.

---

## How to reproduce

```bash
pnpm db:reset && pnpm db:migrate && pnpm db:seed dev
psql "$(bash scripts/database.sh url)" -c "EXPLAIN (ANALYZE, BUFFERS)
  select product_id from product_translation
  where normalized_search_text like '%سرم%';"
```

Use `bash scripts/database.sh url` rather than `pnpm db:url` in command
substitution: pnpm prints an engine warning to stdout, which lands inside the
connection string.
