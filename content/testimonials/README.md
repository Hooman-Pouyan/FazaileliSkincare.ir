# Testimonial source content

This directory holds **privacy-safe, pre-database testimonial candidates**. It is the reviewable source for a future PostgreSQL seed; it is not imported by the application yet.

## First batch

`fa-first-pass-2026-08-24.json` contains 14 Persian transcriptions from Instagram screenshots supplied on 2026-08-24.

- Screenshot line wrapping was removed, but the customer's informal wording and emoji were retained. Punctuation, Persian digits, spacing, and half-spaces received light normalization; this is recorded in the batch metadata.
- Usernames, phone numbers, avatars, timestamps, and other direct identifiers were not copied.
- Raw screenshots are not committed because several contain personal data.
- Every source is traceable by filename and SHA-256 so the private screenshot can be matched during review.
- Every transcription needs an owner comparison before editorial shortening.
- Every record has `publicationConsent = unknown`; none may render publicly in that state.

The batch intentionally accounts for comments that should not become testimonials. `editorialSuitability` distinguishes direct candidates, outcome claims requiring extra review, comments needing relationship context, and social praise that should be excluded.

Each later delivery should be saved as a new dated batch instead of overwriting this first pass. Stable source checksums make it possible to detect a screenshot sent twice across batches.

## Review sequence

For every record:

1. Compare `transcriptionFa` with the private screenshot and set the future transcription state to verified.
2. Confirm whether the writer was a client, workshop attendee, student, colleague, or another relationship.
3. Obtain or record publication consent. If consent covers anonymity only, keep `authorLabelFa` generic.
4. Review treatment-result language for cosmetic/medical claims. A customer's claim is still a claim when quoted by the business.
5. Create `displayQuoteFa` only by shortening complete sentences without changing meaning. Keep the full transcription as immutable source text.
6. Map `relatedOfferingCandidate` to a canonical service/course only after that offering exists.
7. Approve and publish through an authorized admin workflow; never publish directly from this JSON file.

## Future PostgreSQL shape

Prefer a `testimonial` table over a generic `feedback` table: this dataset is curated public-facing content, not a customer-support inbox. The minimum useful columns are:

- `id`, `locale`, immutable `sourceText`, optional reviewed `displayQuote`;
- anonymous display attribution and verified relationship type;
- content kind and optional canonical offering key;
- source kind and unique source checksum;
- transcription, consent, moderation, and claim-review states;
- `isFeatured`, `sortOrder`, `publishedAt`, and UTC audit timestamps.

The seed must be idempotent on `sourceChecksum`, insert records as unpublished drafts, and never carry source usernames or phone numbers into the public content table.

## Display direction

Testimonials can feed the home page, brand story, treatment pages, and relevant PLP/PDP editorial sections after approval. Use one reusable read model and select records by context rather than creating separate mock arrays for each carousel.

The current design language explicitly avoids autoplay carousels. Prefer a manually controlled RTL testimonial rail with scroll snap, arrows/swipe, a pauseable optional fade after interaction, and `prefers-reduced-motion` support. Do not put multiple continuously moving quote rails behind the page: the comments are meaningful content, not decorative texture, and constant opposing motion would reduce readability and accessibility.
