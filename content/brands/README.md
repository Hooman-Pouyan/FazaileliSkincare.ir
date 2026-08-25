# Brand source content

This directory holds reviewable brand candidates transcribed from public Instagram story screenshots. The JSON is future seed input; APIs and Server Actions must eventually read approved brand rows from PostgreSQL rather than importing this file at runtime.

## Current batch

- instagram-first-pass-2026-08-24.json contains 13 visible marks from one screenshot.
- The business owner described these as skincare-product brands the institute supports or works with.
- The screenshot proves that the marks were presented under the Persian heading «برندها». It does not by itself prove current distribution, stock, image rights, exclusivity, or official-representative status.
- Existing repository evidence confirms country metadata for Forlle'd, Storyderm, and Thalgo, and confirms official-representative status only for Forlle'd.

## Review requirements

1. Confirm each canonical spelling and whether O2 is a standalone Brand or a ProductLine.
2. Confirm the relationship type for every entry: carried, used in treatment, training partner, distributor, or official representative.
3. Confirm countries and approved Persian/English display names before creating brand_translation rows.
4. Do not publish logos from the screenshot. Logo assets and publication rights require a separate approved media source.
5. Seed by slugCandidate idempotently and keep unknown official-representative status distinct from a confirmed false decision during review.

All records remain unpublished draft candidates.
