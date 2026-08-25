# Academy source content

This directory holds reviewable, pre-database academy offering candidates transcribed from public Instagram story screenshots. The application does not import these files yet.

## Current batch

- fa-instagram-first-pass-2026-08-24.json contains two comprehensive course candidates and eight short workshop candidates.
- The introductory curriculum continues across source images 1 and 2.
- The advanced course is advertised as including the introductory course plus four workshops. It remains one course candidate with explicit inclusion links; a future schema decision may instead map it to Course plus Package records.
- Source screenshots are not committed in this batch. Original filenames, dimensions, and SHA-256 checksums are retained for review.

## Review requirements

1. Compare every Persian transcription with the original screenshots, especially the flagged wording in introductory curriculum item 10.
2. Confirm that the abbreviated prices mean 18, 39, and 6 million tomans. Structured candidate prices are stored only as integer rials.
3. Confirm whether the advertised certificates are current and which organization issues each one.
4. Confirm whether the eight short workshops are independent Course rows, Cohorts of reusable courses, or Package inclusions.
5. Map brand/range names such as O2 Princess Shine, Time Machine, Forlle'd, MCCosmetics, and BioRePeel to canonical catalogue entities only after those entities are approved.
6. Seed every record as an unpublished draft. Publication, enrolment availability, capacity, dates, instructors, venue, and inventory-backed kit requirements require separate owner approval.

## Future database direction

Use stable course identities separately from dated Cohorts. Curriculum items should become ordered modules or lessons. The advanced offering's included items should use relationships rather than copied course rows, and workshop participation rules should remain source policy until the Academy schema has an explicit enrollment-rule model.

The future seed must be idempotent on candidateKey, keep all monetary values as integer rials, and preserve the source transcription for audit. API and Server Action reads must come from PostgreSQL after seeding, not from these JSON files at runtime.
