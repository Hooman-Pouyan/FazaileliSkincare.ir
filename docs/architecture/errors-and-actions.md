# Errors and Server Actions

**Status:** Accepted  
**Accepted:** 2026-08-24  
**Scope:** Server reads, route outcomes, Server Actions, forms, client feedback, logging, retry, and idempotency

## Error taxonomy

| Category                  | Examples                                                                              | Representation                               | Owner                                              |
| ------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| Input validation          | malformed quantity, missing variant, invalid phone                                    | Zod issues / typed field result              | Form or invoking control                           |
| Expected domain rejection | sold out, restricted, reservation expired, price changed                              | Typed recoverable action result              | Feature composition with Persian recovery guidance |
| Route outcome             | invalid query, not found, locale unavailable, canonical redirect                      | Typed outcome                                | Route/module screen                                |
| Authentication/ownership  | expired session, anonymous cart mismatch, forbidden management action                 | Typed safe result or framework/auth response | Auth/action boundary                               |
| Operational failure       | database unavailable, SMS/payment provider timeout                                    | Thrown typed operational error               | Route error boundary + server logging              |
| Integrity failure         | missing required public price, negative effective availability, broken media ordering | Thrown typed integrity error                 | Fail-closed boundary + high-priority logging       |

An operational or integrity failure must never impersonate a valid empty state, unavailable offer, or not-found result.

## Server Action sequence

Every Server Action follows this order:

1. parse unknown input with the shared Zod schema;
2. authenticate or resolve server-issued anonymous ownership;
3. authorize the exact resource/action;
4. read current server truth required for the decision;
5. perform related writes in one transaction when atomicity matters;
6. record idempotency/audit/outbox effects required by the domain;
7. invalidate the specific route/query surface affected;
8. return a serializable typed success or expected-rejection result.

Unknown errors are not caught and rewritten as generic success/empty results. Catch only when the boundary can add context, translate a known provider failure, roll back/compensate safely, or return an explicitly modeled recoverable state.

## Action result contract

Expected results are discriminated and serializable. A result should identify:

- stable result code;
- localized-message key or presentation reason, not arbitrary database/provider text;
- field issues where applicable;
- whether retry is safe;
- current server model or recovery data when the UI must reconcile;
- opaque diagnostic reference only when a server log entry exists.

Do not return stack traces, SQL, session identifiers, internal IDs not required by the UI, or untranslated provider messages.

## Commerce and cart rules

- Price, group precedence, eligibility, stock, and reservation validity are re-read server-side for every cart mutation.
- `on_request`, restricted, unavailable, and variant-required offers cannot be added by manipulating client state.
- Cart actions are retry-safe according to the accepted cart research contract.
- Reservation writes never decrement `onHand`; confirmed payment owns stock decrement in the same transaction as payment/order confirmation.
- A client-provided subtotal or item price is ignored.

## Form error ownership

The shared Form layer maps schema and expected field errors beside their controls. Root form errors render in a named form-level error surface. Non-form actions render feedback in the invoking component or route composition.

Do not:

- store errors in Zustand;
- show both an inline error and duplicate toast for the same failure;
- use a success toast before the server result is known;
- clear customer input after a recoverable failure;
- expose raw server/provider messages as Persian copy.

See [`../ui/forms.md`](../ui/forms.md) for field anatomy and form state.

## Retry and idempotency

- Reads may retry only when the failure class and latency budget make retry useful.
- Validation, forbidden, not-found, and integrity failures are not retried.
- Mutations never receive automatic client retry unless the operation has a documented idempotency key/semantic and the user experience defines duplicate submission behavior.
- Payment confirmation, cart reservation renewal, receipt claims, and external webhook processing follow their domain-specific idempotency contracts.
- The UI communicates when retry is safe and preserves the customer's work.

## Logging and feedback responsibility

| Surface                     | Responsibility                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Zod/Form                    | Local input and field errors                                                                                   |
| Action result               | Expected domain rejection and recovery data                                                                    |
| Route outcome               | Canonical, invalid, unavailable, not-found decisions                                                           |
| `error.tsx`                 | Safe operational failure presentation and retry entry                                                          |
| Server logger/observability | Full internal context, correlation, severity, provider/database details                                        |
| Toast                       | Short confirmation or non-duplicated global feedback; never the only accessibility surface for critical errors |

Observability tooling remains subject to the Iran-hosting and privacy decision. No foreign runtime script is introduced to collect errors.

## Verification

- Schema rejects malformed and hostile input.
- Ownership and authorization run before protected data access/mutation.
- Expected errors map to the right field or action surface.
- Unknown errors reach the boundary and server log.
- Duplicate/retry scenarios prove idempotency.
- Infrastructure failure never renders empty catalogue/cart truth.
- Keyboard and screen-reader users receive the same error and recovery information.
