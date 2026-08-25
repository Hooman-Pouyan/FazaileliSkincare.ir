# Authentication and account security - phased implementation plan

**Status:** Review-ready; no runtime implementation is authorized by this document  
**Updated:** 2026-08-24  
**Scope:** Customer authentication, staff authentication, sessions, authorization, account security, and customer account closure  
**Depends on:** [`../01-adr-001-stack.md`](../01-adr-001-stack.md), [`../03-domain-model.md`](../03-domain-model.md), [`database-foundation.md`](database-foundation.md), and [`../architecture/errors-and-actions.md`](../architecture/errors-and-actions.md)  
**Review input:** [`../16-review-storefront-and-database.md`](../16-review-storefront-and-database.md)

## 1. Goal and stopping boundary

Deliver one self-hosted authentication system that:

- lets customers sign up and sign in with an Iranian mobile number and a short-lived OTP;
- gives staff a separate email/password entry with mandatory TOTP;
- stores sessions only in secure, httpOnly, server-owned cookies;
- centralizes role and ownership checks for Commerce, Booking, Academy, Account, and Admin;
- lets a customer inspect and revoke sessions, change their phone safely, and close their account;
- survives SMS abuse, session theft attempts, account enumeration, replay, and customer deletion without corrupting financial records.

This plan does **not** implement social login, passkeys, customer passwords, customer email login, OAuth, SSO, a native mobile token flow, or health-data permissions. Those require a new decision and threat-model review.

## 2. Decisions

### AUTH-D1 - Better Auth remains the authentication engine

Use the pinned `better-auth@1.7.1` package with its PostgreSQL Drizzle adapter, phone-number plugin, two-factor plugin, and Next.js cookie integration.

Why:

- it keeps credentials and sessions in the Iran-hosted application database;
- it supplies maintained password hashing, OTP verification, session rotation, and TOTP behavior;
- it avoids building a deceptively small custom system that would later need password reset, session revocation, rate limiting, and recovery;
- it avoids a critical runtime dependency on Auth0, Clerk, Firebase Auth, or another foreign managed identity service that may be inaccessible to Iranian customers or unavailable to the operator.

Better Auth owns authentication mechanics. Application code still owns phone normalization, SMS delivery, authorization, account lifecycle policy, audit events, and safe domain-facing errors.

Current documentation used for this decision:

- [Better Auth Drizzle adapter](https://www.better-auth.com/docs/adapters/drizzle)
- [Better Auth phone-number plugin](https://www.better-auth.com/docs/plugins/phone-number)
- [Better Auth two-factor authentication](https://www.better-auth.com/docs/plugins/2fa)
- [Better Auth Next.js integration](https://www.better-auth.com/docs/integrations/next)

### AUTH-D2 - Customer and staff credentials are deliberately different

| Actor                           | Entry                                     | Credential                                    | Additional requirement                |
| ------------------------------- | ----------------------------------------- | --------------------------------------------- | ------------------------------------- |
| Customer, student, practitioner | `/[locale]/login` then `/[locale]/verify` | Normalized Iranian phone number + 6-digit OTP | None at ordinary sign-in              |
| Staff, admin                    | `/[locale]/admin/login`                   | Verified email + Better Auth-managed password | TOTP is mandatory before Admin access |

Customer v1 is phone/OTP-only. Email may later be collected as profile/contact data after verification, but it is not a customer credential in this phase. There is no customer password form, password-reset route, or password-setting endpoint exposed through the product.

Staff email/password sign-up is disabled. A current admin provisions staff, assigns the `staff` or `admin` role, and requires TOTP enrolment before the account can pass the Admin authorization boundary. Recovery uses single-use backup codes plus an audited admin procedure; SMS alone cannot recover an admin account.

This resolves the earlier documentation contradiction in favour of the passwordless customer model already described in the site map. It also preserves a practical password path where it earns its complexity: privileged staff access.

### AUTH-D3 - One identity, multiple roles, no role copied into the session as authority

`person` is the identity row. `person_role` is the authorization source. A person may be a customer, student, practitioner, staff member, and/or admin.

Session data may contain a role snapshot for display convenience, but every protected write and every sensitive read resolves current roles from PostgreSQL. Removing a staff role therefore takes effect without waiting for a cookie to expire. Admin removal also revokes that person's active sessions in the same transaction.

Authorization helpers are explicit:

```ts
requireSession(): Promise<AuthenticatedPerson>
requireRole(role: "customer" | "student" | "practitioner" | "staff" | "admin"): Promise<AuthenticatedPerson>
requireAnyRole(roles: readonly Role[]): Promise<AuthenticatedPerson>
requireRecentAuthentication(maxAgeSeconds: number): Promise<AuthenticatedPerson>
```

Feature modules receive the authenticated person identifier and approved role facts; they never import Better Auth adapter rows or parse cookies themselves.

### AUTH-D4 - Pre-authentication writes use the Better Auth Route Handler

The project rule requires every Server Action to start with a Zod parse and an authorization check. Login and OTP verification cannot satisfy an authorization check because the user is not authenticated yet.

Therefore:

- `/api/auth/[...all]` is the only unauthenticated authentication mutation boundary;
- Better Auth and its plugin validators own the pre-authentication request contract;
- authenticated account changes use application Server Actions and follow `Zod parse -> authoritative session/authorization -> database work`;
- routes and Server Components never call an internal HTTP API for authenticated application reads.

### AUTH-D5 - Phone numbers are canonical E.164 values

All accepted Iranian numbers are normalized with `libphonenumber-js` to `+98...` before lookup, rate limiting, storage, or SMS delivery. Persian and Arabic digits are converted before parsing. A local `09...` display value never becomes a database key.

The database adds an E.164 check:

```sql
phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$'
```

One verified phone maps to one `person`. Changing a phone requires successful OTP verification of both the current and the new number, an authoritative current session, and revocation of every session except the completing request.

### AUTH-D6 - OTP limits are explicit and protect both accounts and the SMS budget

Customer sign-in uses:

- 6 digits;
- 120-second expiry;
- one-time use;
- maximum 3 verification attempts for one code;
- minimum 60 seconds between sends to the same phone;
- maximum 5 sends per normalized phone per rolling hour;
- maximum 20 sends per trusted client IP per rolling hour;
- maximum 10 failed verification attempts per phone per rolling hour;
- maximum 30 failed verification attempts per trusted client IP per rolling hour.

All pre-authentication responses are generic and do not reveal whether a phone or staff email exists. Rate-limit keys are HMACs of the normalized identifier or trusted IP, not raw phone numbers. OTP values and complete phone numbers never enter application logs, audit payloads, analytics, or error-monitoring metadata.

The reverse proxy is part of this boundary. Production must configure Better Auth's trusted-proxy/client-IP behavior for the selected Iranian platform and prove with an integration test that an arbitrary multi-hop `X-Forwarded-For` value cannot spoof the rate-limit key. Deployment fails closed when production has no approved client-IP header or trusted proxy list.

### AUTH-D7 - SMS delivery is direct and time-bounded; the general outbox worker stays deferred

OTP delivery uses the shared `Notifier` adapter but is not inserted into the general notification outbox because an OTP is short-lived and interactive. Better Auth's `sendOTP` callback schedules delivery with Next.js `after()` so provider latency does not expose account timing or hold the HTTP response open. The callback has a 10-second maximum duration and emits only a redacted delivery result.

`after()` is not a durable queue. A process crash may lose one send, and the user can request another after the 60-second cooldown. Order, payment, and fulfilment notifications use `notification_outbox`; their worker remains a separately approved operational phase. Correctness never depends on an SMS being delivered.

### AUTH-D8 - Sessions are server-owned and revocable

Session policy:

- cookie is `httpOnly`, `Secure` outside local development, `SameSite=Lax`, and `Path=/`;
- no auth token, refresh token, or session identifier enters `localStorage`, `sessionStorage`, Zustand persistence, or a client-readable cookie;
- inactivity expiry is 7 days;
- absolute lifetime is 30 days, enforced from `auth_session.created_at`;
- ordinary rotation occurs after 24 hours of use;
- password, TOTP, phone, role, or account-security changes revoke other sessions;
- sensitive changes require an authoritative database session read and authentication no older than 10 minutes;
- staff/admin sessions additionally fail closed when TOTP is not enrolled or the role was removed.

Better Auth stores session tokens in plaintext by default. This plan does not diverge from the adapter by inventing token hashing. The compensating controls are restricted database credentials, encrypted provider backups and off-platform dumps, no session values in logs, least-privilege operational access, and immediate mass revocation after suspected database exposure.

### AUTH-D9 - CSRF and origin checks are mandatory

Only configured HTTPS origins for `fazaieli.ir`, staging, and explicit local development are trusted. Production does not accept wildcard origins. Better Auth's origin/CSRF validation remains enabled. Application Route Handlers additionally validate method and content type where relevant.

Gateway callbacks are not treated as authenticated browser actions. They live in the Commerce boundary, verify provider evidence server-to-server, and do not weaken auth origin checks.

### AUTH-D10 - Customer account closure preserves financial truth

Account closure is available to customers, but it is not a blind cascade:

1. require a recent authoritative session and a fresh phone OTP;
2. reject closure while an order, payment review, return, refund, appointment, or enrolment needs customer action;
3. require the order contact phone and required invoice/address facts to exist as immutable snapshots;
4. release active cart reservations and close the cart;
5. revoke sessions and delete credentials, addresses, and active roles;
6. anonymize the `person` row in place: clear phone/name/image, clear verification flags, replace display/email with non-PII closed-account values under `.invalid`, and set `closed_at`;
7. preserve historical foreign-key integrity while all customer-visible and authentication PII is removed;
8. append a redacted account-closure audit event that contains no deleted PII.

The anonymized row allows Booking, Academy, payment, and audit history to remain referentially sound as those contexts grow. Re-registering the former phone creates a new person; historical orders are not silently relinked. The separate `customer_order.contact_phone` correction still makes financial records self-contained and keeps a future controlled physical deletion possible.

Staff/admin identities cannot use customer self-service closure. They are deprovisioned by an admin: roles are removed, sessions and credentials are revoked, and the identity row remains when audit foreign keys require it.

The legal retention policy must state how long invoice, order, payment, bank-transfer, shipping, and return records are retained. The application must not claim those legally required records are erased when an account is closed.

## 3. Database contract changes

The auth implementation begins with one reviewed correction migration. It must be generated through Drizzle, reviewed as SQL, applied to a fresh PostgreSQL 16 database, and verified before runtime auth code lands.

Required identity changes:

- add the E.164 check to `person.phone`;
- add nullable `person.closed_at` plus checks that a closed person has no phone, verified email/phone, or non-placeholder email;
- add `auth_two_factor` with Better Auth-compatible user relation, encrypted TOTP secret, hashed/encrypted backup-code material, failed-attempt count, and lock timestamp;
- add the Better Auth-required two-factor enabled field to `person` if adapter verification confirms it is read from the user model;
- keep `auth_account.password` because staff credentials use it; customer code never creates a credential account;
- keep non-null placeholder email support for phone-first Better Auth users;
- generate placeholder emails deterministically from an HMAC of normalized phone plus an auth-only pepper, under the reserved `.invalid` domain;
- preserve `email_is_placeholder = true` and `email_verified = false` for those values;
- index verification expiry and rate-limit cleanup paths after the real adapter query shapes are captured;
- add schema assertions for every Better Auth model/field mapping.

The same correction migration or its immediately preceding Commerce correction must add `customer_order.contact_phone`. Account closure cannot ship before that snapshot column is populated and required.

## 4. Module and file boundaries

Implementation creates only files with immediate responsibility:

```text
src/lib/auth/
  auth.ts                    Better Auth server configuration and plugins
  auth-client.ts             typed browser client for pre-auth endpoints only
  authorization.ts           requireSession/role/recent-auth helpers
  phone.ts                   digit conversion, E.164 normalization, masking
  rate-limit-key.ts          HMAC key construction without raw identifiers
  notifier.ts                OTP-specific Notifier adapter boundary
  account-closure.ts         account closure transaction service

src/modules/account/
  screens/security.screen.tsx
  components/session-list.tsx
  components/change-phone-form.tsx
  components/close-account-form.tsx
  models/security.models.ts
  models/security.schemas.ts
  tests/security.integration.test.ts
  i18n/fa.json
  i18n/en.json
  i18n/ar.json
  account.reads.ts
  account.actions.ts
  account.store.ts

src/app/[locale]/
  (auth)/login/page.tsx
  (auth)/verify/page.tsx
  (account)/account/security/page.tsx
  (admin)/admin/login/page.tsx

src/app/api/auth/[...all]/route.ts
```

`account.store.ts` may own only form-step and disclosure interaction state. It never owns a session, role, phone, security result, or server error.

## 5. Public interfaces

### Unauthenticated Better Auth boundary

The Better Auth handler exposes the plugin-owned phone send/verify and staff credential/TOTP endpoints under `/api/auth/*`. Application code does not create duplicate `/api/login` or `/api/otp` wrappers.

### Server-only application boundary

```ts
getSecurityPage(): Promise<SecurityPageModel>
requireSession(): Promise<AuthenticatedPerson>
requireRole(role: Role): Promise<AuthenticatedPerson>
requireRecentAuthentication(maxAgeSeconds: number): Promise<AuthenticatedPerson>
```

### Authenticated Server Actions

```ts
beginPhoneChange(input: unknown): Promise<SecurityActionResult>
confirmPhoneChange(input: unknown): Promise<SecurityActionResult>
revokeSession(input: unknown): Promise<SecurityActionResult>
revokeOtherSessions(input: unknown): Promise<SecurityActionResult>
closeCustomerAccount(input: unknown): Promise<SecurityActionResult>
```

Every action starts with its shared Zod schema, then authoritative session/role/ownership validation, then database work. Expected outcomes use stable codes such as `INVALID_PHONE`, `OTP_REQUIRED`, `OTP_EXPIRED`, `SESSION_NOT_FOUND`, `RECENT_AUTH_REQUIRED`, `ACCOUNT_HAS_OPEN_OBLIGATIONS`, and `RATE_LIMITED`. Provider/database faults throw and go to the operational boundary.

## 6. Phased delivery

### AUTH0 - Reconcile and lock the schema contract

**Files:** `src/lib/db/schema/identity.ts`, `src/lib/db/schema/order.ts`, generated next Drizzle migration and snapshot, `src/lib/db/schema/schema.test.ts`.

- [ ] Add failing schema assertions for E.164 phones, Better Auth field mappings, TOTP persistence, placeholder-email rules, and order contact snapshots.
- [ ] Add the correction migration and backfill path.
- [ ] Migrate a fresh PostgreSQL 16 database and prove repeat application from migration `0000`.
- [ ] Run the Better Auth CLI/schema comparison in check-only mode; application table and field mappings must match without letting the CLI overwrite the canonical schema.

**Exit gate:** Better Auth 1.7.1 can read and write the mapped identity tables in a disposable database; no customer/password ambiguity remains.

### AUTH1 - Build phone normalization, rate limiting, and Notifier boundary

**Files:** `src/lib/auth/phone.ts`, `rate-limit-key.ts`, `notifier.ts`, and focused tests.

- [ ] Write table-driven tests for Persian/Arabic digits, Iranian local numbers, E.164 output, invalid country/length values, masking, and HMAC rate-limit keys.
- [ ] Implement the canonical normalization and redaction utilities.
- [ ] Implement the SMS adapter interface with a fake and one selected Iranian provider adapter.
- [ ] Test every numeric send/verify limit and confirm raw phone/OTP values are absent from logs.

**Exit gate:** the same normalized value owns lookup, uniqueness, rate limits, and delivery; abuse tests receive generic outcomes.

### AUTH2 - Integrate Better Auth customer phone OTP

**Files:** `src/lib/auth/auth.ts`, `auth-client.ts`, `src/app/api/auth/[...all]/route.ts`, auth route-group pages, and auth tests.

- [ ] Write integration tests for new signup, returning sign-in, wrong/expired/replayed OTP, rate limits, cookie flags, logout, and disabled customer password signup.
- [ ] Configure Drizzle, `phoneNumber`, `nextCookies`, trusted origins, session policy, and application hooks.
- [ ] Add Persian-first login and verification screens with generic enumeration-safe feedback.
- [ ] Verify direct/reload/back navigation and 390px RTL keyboard behavior.

**Exit gate:** a customer can sign up, sign in, refresh, and sign out through httpOnly cookies; no client-readable token exists.

### AUTH3 - Add centralized authorization and session security

**Files:** `src/lib/auth/authorization.ts`, authorization tests, protected account layout, and one representative protected write test.

- [ ] Test missing, expired, revoked, absolute-age-expired, and role-removed sessions.
- [ ] Implement the four authorization helpers and fail-closed role reads.
- [ ] Protect Account and Admin layouts without placing authorization truth in middleware/proxy alone.
- [ ] Prove a revoked cookie cannot authorize a Server Action or server-only read.

**Exit gate:** every protected feature has one server-side authorization path, and current database roles win over session snapshots.

### AUTH4 - Add staff password and mandatory TOTP

**Files:** Better Auth configuration, admin login/enrolment screens, admin provisioning action, TOTP tests, and i18n messages.

- [ ] Test disabled public email signup, staff provisioning, password login, required TOTP challenge, invalid/replayed TOTP, backup-code single use, lockout, and role removal.
- [ ] Enable email/password only for provisioned accounts and add the two-factor plugin.
- [ ] Require TOTP enrolment before any Admin route or action succeeds.
- [ ] Add an audited admin deprovision flow that removes roles and revokes credentials/sessions.

**Exit gate:** a password alone never opens Admin, and no public endpoint can create a staff credential.

### AUTH5 - Deliver the security page and account lifecycle

**Files:** `src/modules/account/*`, `/account/security`, `src/lib/auth/account-closure.ts`, and integration tests.

- [ ] Test security-page reads, revoke-one, revoke-others, dual-OTP phone change, open-obligation rejection, anonymized customer closure, and re-registration without historical relinking.
- [ ] Implement page-ready session models with masked device/IP facts.
- [ ] Implement phone change and session revocation actions.
- [ ] Implement the account-closure transaction only after the order-contact and reservation-FK corrections pass.

**Exit gate:** customers can manage sessions, change phone, and close an eligible account without losing or corrupting financial records.

### AUTH6 - Production hardening and rollout

**Files:** deployment/runbook documentation, environment validation, smoke tests, and operational dashboards.

- [ ] Validate trusted origins, trusted proxy/client-IP behavior, cookie flags, database permissions, backup encryption, and secret rotation in Iranian staging.
- [ ] Run SMS-provider failure, timeout, duplicate request, clock-skew, database outage, and process-restart scenarios.
- [ ] Add alerts for send spikes, verify failures, rate-limit spikes, staff lockouts, and session-revocation anomalies without PII.
- [ ] Roll out customer auth first, then staff auth/TOTP, then account closure.

**Exit gate:** staging evidence proves the real proxy, SMS provider, PostgreSQL instance, cookies, backup controls, and Persian mobile flow; rollback is configuration-based and does not require deleting identity data.

## 7. Required test matrix

At minimum:

- new and returning customer phone flows;
- Persian, Arabic, and Latin digit entry;
- wrong, expired, replayed, and superseded OTP;
- phone and IP rate-limit boundaries;
- spoofed proxy headers;
- placeholder-email collision behavior;
- customer cannot create/use a password;
- staff password without TOTP is denied;
- role removal invalidates authorization;
- session enumeration, revoke-one, and revoke-others;
- two simultaneous phone-change attempts;
- account closure with and without open obligations;
- closure after a paid order preserves order/contact/invoice history;
- SMS and database operational failures stay distinct from invalid credentials;
- `fa` RTL at 390/768/1440 and keyboard/screen-reader form behavior.

## 8. Security review checklist

- No raw phone, OTP, password, TOTP secret, backup code, session token, or provider secret is logged.
- No auth token is client-readable or persisted in a browser store.
- All application writes parse then authorize before database access.
- Pre-authentication writes exist only under the Better Auth handler.
- Customer password signup and reset are unreachable.
- Staff TOTP and current-role checks are enforced server-side.
- Trusted proxy configuration is provider-specific and tested.
- Session tokens are covered by restricted DB access and encrypted backups.
- Account closure cannot cascade into order/payment corruption.
- Financial retention language matches actual deletion behavior.

## 9. Completion definition

Authentication is complete only when customer phone OTP, staff password+TOTP, session management, role enforcement, phone change, account closure, Persian RTL QA, abuse tests, and Iranian staging verification all pass. A successful Better Auth demo login alone is not completion.
