-- Review correction C3 (MEDIUM-3): the search index could not serve the search
-- query. The btree on (locale_code, normalized_search_text) answers prefix and
-- exact lookups; a Persian shopper typing part of a product name needs infix and
-- typo tolerance, which only a trigram index can give.
--
-- drizzle-kit emits the index but not the extension it depends on, so the
-- CREATE EXTENSION below is added by hand. Without it gin_trgm_ops does not
-- exist and the index statement fails.
--
-- pg_trgm ships with PostgreSQL's contrib package and is available on every
-- managed host under consideration. Creating it requires elevated rights, so
-- the deploy migration role needs them for this one statement — recorded here
-- because DB7 provisions that role.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- Trigram rather than a text search configuration: PostgreSQL ships no Persian
-- stemmer, so a configuration would be a guess. The column is already
-- normalized by normalizeCatalogSearchText at every write, and the query path
-- must normalize its input the same way before comparing.
CREATE INDEX "product_translation_search_trgm_idx" ON "product_translation" USING gin ("normalized_search_text" gin_trgm_ops);
