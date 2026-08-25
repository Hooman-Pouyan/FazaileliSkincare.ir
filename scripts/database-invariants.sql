DO $db1$
DECLARE
  actual_count integer;
BEGIN
  IF current_setting('server_encoding') <> 'UTF8' THEN
    RAISE EXCEPTION 'expected UTF8 server encoding, found %', current_setting('server_encoding');
  END IF;

  IF current_setting('TimeZone') <> 'UTC' THEN
    RAISE EXCEPTION 'expected UTC server timezone, found %', current_setting('TimeZone');
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public';

  IF actual_count <> 48 THEN
    RAISE EXCEPTION 'expected 48 public tables, found %', actual_count;
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM pg_catalog.pg_type AS type
  INNER JOIN pg_catalog.pg_namespace AS namespace
    ON namespace.oid = type.typnamespace
  WHERE namespace.nspname = 'public'
    AND type.typtype = 'e';

  IF actual_count <> 20 THEN
    RAISE EXCEPTION 'expected 20 public enums, found %', actual_count;
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM drizzle.__drizzle_migrations;

  IF actual_count <> 1 THEN
    RAISE EXCEPTION 'expected migration 0000 exactly once, found % records', actual_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'product_published_state_check'
  ) THEN
    RAISE EXCEPTION 'missing product publication constraint';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'inventory_on_hand_check'
  ) THEN
    RAISE EXCEPTION 'missing non-negative inventory constraint';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint WHERE conname = 'customer_order_totals_check'
  ) THEN
    RAISE EXCEPTION 'missing server-owned order totals constraint';
  END IF;

  IF to_regclass('public.locale_one_primary_unique') IS NULL THEN
    RAISE EXCEPTION 'missing primary-locale uniqueness index';
  END IF;

  IF to_regclass('public.payment_settlement_payment_unique') IS NULL THEN
    RAISE EXCEPTION 'missing one-settlement-per-payment index';
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM locale;

  IF actual_count <> 3 THEN
    RAISE EXCEPTION 'expected 3 locales after repeat seed, found %', actual_count;
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM locale
  WHERE is_primary;

  IF actual_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly one primary locale, found %', actual_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM locale
    WHERE code = 'fa'
      AND is_active
      AND is_primary
  ) THEN
    RAISE EXCEPTION 'expected fa to be the active primary locale';
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM concern;

  IF actual_count <> 5 THEN
    RAISE EXCEPTION 'expected 5 concerns after repeat seed, found %', actual_count;
  END IF;

  SELECT count(*)
  INTO actual_count
  FROM concern_translation;

  IF actual_count <> 10 THEN
    RAISE EXCEPTION 'expected 10 concern translations after repeat seed, found %', actual_count;
  END IF;
END
$db1$;

SELECT 'DB1 invariants passed' AS result;
