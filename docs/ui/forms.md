# Forms contract

**Status:** Accepted foundation contract  
**Accepted:** 2026-08-24  
**Implementation status:** Shared Field/Form primitives remain to be implemented in the owning foundation slice

## Decision

Use one small, layered Field/Form composition over React Hook Form and Zod. Every form has one canonical Zod schema shared by client validation and its Server Action. Do not build a form factory, schema DSL, or per-feature replacement Field set.

## Ownership

| Concern                                                 | Owner                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Input validation and inferred input type                | Form's canonical Zod schema                                                    |
| Edit buffer, touched/dirty state, client validation     | React Hook Form                                                                |
| Cross-step workflow state                               | Module Zustand store only when the accepted journey spans mounted compositions |
| Authorization, ownership, price/stock/domain validation | Server Action/domain code                                                      |
| Field and root expected errors                          | Form/action result mapping                                                     |
| Unknown operational failure                             | Route/error boundary and server logging                                        |

Form values are not copied into Zustand merely to make them globally observable. A multi-step flow may preserve an accepted draft through the module store, but each step's active controls still use React Hook Form and the shared schema.

## Public anatomy

The shared API should provide composable pieces equivalent to:

- `Form`: submission, form-level description/error/status, disabled/pending context;
- `FormField`: React Hook Form controller/registration boundary;
- `Field`: layout group;
- `FieldLabel`: visible label and required/optional treatment;
- `FieldControl`: connects IDs and invalid/disabled state to the actual control;
- `FieldDescription`: help, format, or consequence copy;
- `FieldError`: one or several deduplicated localized messages;
- `Fieldset` and `Legend`: grouped controls;
- `FieldArray`: repeated items only when a real form needs them.

Use semantic HTML first. A text input with label/help/error does not need a custom abstraction beyond consistent composition.

## Schema placement and use

- Feature form schemas live in `src/modules/<module>/models/<form>.schema.ts` or the approved module-root schema when also used directly by Server Actions.
- Infer TypeScript types from Zod; do not maintain a parallel handwritten input interface.
- Client submission passes unknown/serialized input to the Server Action; the action parses again before authorization or database work.
- Domain rules requiring current database state remain server-owned and are not duplicated as authoritative client refinements.
- Reusable field-level validators are allowed only when several accepted schemas share the exact rule and error semantics.

## Empty-value policy

HTML controls produce strings, including empty strings. Each schema must deliberately define its boundary:

- required text: trim and reject empty;
- optional text: map empty string to `undefined` when absence is the domain value;
- nullable database value: use `null` only when the domain distinguishes it from absence;
- numbers/money: preserve the editable string in the control, parse at the schema boundary, and reject partial/invalid numeric syntax;
- checkboxes/switches: adapt the control's boolean event explicitly;
- select placeholders: never submit display labels as values.

Money inputs accept an approved digit/grouping presentation but normalize to integer rials at the server boundary. Floats and toman values never enter domain/database input.

## Server Action sequence

```text
unknown FormData/input
  -> shared Zod parse
  -> authentication/anonymous ownership
  -> authorization
  -> current server/domain validation
  -> transaction/write
  -> specific invalidation
  -> typed serializable result
```

See [`../architecture/errors-and-actions.md`](../architecture/errors-and-actions.md) for error, retry, and idempotency rules.

## Server errors

Expected failures return stable typed codes and field paths that the Form layer can map:

- field errors render beside the field and join `aria-describedby`;
- multiple errors are deduplicated and presented as a readable list;
- form/root errors render in a named form-level region;
- action-level domain changes such as stock/price/eligibility render near the affected action/summary with recovery guidance;
- focus moves to the first invalid field or root error summary after failed submission;
- submitted values remain intact after recoverable failure.

Unknown operational errors propagate to the appropriate boundary. Do not manually `toast.error` the same failure already rendered inline, and do not translate arbitrary server/provider strings at runtime.

## Pending and submission behavior

- Disable only controls whose repeated interaction is unsafe; preserve reading, navigation, and cancellation where allowed.
- Submit controls expose an accessible pending label/status without changing width unexpectedly.
- Prevent accidental duplicate submission, while relying on server idempotency for operations where duplication has financial/inventory consequences.
- Do not show success or reset the form before the server confirms success.
- Navigation after success is owned by the accepted journey and uses locale-aware routing.

## Accessibility

- Every control has a visible localized label.
- Description and error IDs are stable and referenced by `aria-describedby`.
- Invalid state uses `aria-invalid` and visible non-color treatment.
- Required state is conveyed textually/semantically, not only with an asterisk.
- Fieldsets/legends group checkboxes, radios, dates, variants, and composite choices.
- Error summaries contain links/focus targets when a long form requires them.
- Touch targets are at least 44px and focus-visible styling meets repository contrast rules.
- RTL visual order does not change semantic DOM or keyboard order.

## Persian and direction

- Persian copy is the source, with concise labels and actionable error text.
- Phone, email, URL, SKU, tracking, and payment-reference inputs use explicit LTR/isolation while their labels/help remain RTL.
- Choose `inputMode` and `autoComplete` based on the actual field.
- Accept Persian/Arabic digit input only through a documented normalizer; display identifiers in the form customers must submit/copy.
- Dates and money use canonical utilities, never component-local concatenation/conversion.

## Performance and render behavior

- Subscribe at the smallest field or status boundary; avoid reading the entire `formState` above a large form.
- Do not watch every field when a narrow `useWatch` or derived schema rule suffices.
- Async validation is reserved for a real server-backed uniqueness/availability need and is debounced/cancellable where appropriate.
- Large option sets use an approved server-backed combobox rather than rendering unbounded options.
- Form state stays local to the mounted flow unless cross-step persistence is an accepted requirement.

## Required tests

Each form covers:

- valid submission and parsed server input;
- required, optional, empty, malformed, and boundary values;
- expected field and root server errors;
- authorization/ownership before mutation;
- pending and duplicate submission behavior;
- value preservation and focus after failure;
- Persian labels/errors, RTL, mixed-direction values, keyboard and screen-reader relationships;
- mobile target sizing and long-copy wrapping.

Financial, inventory, booking-capacity, consent, and authentication forms additionally require real integration tests for their server-owned invariants.

## Rejected approaches

- A Coordeck-sized generated form factory: too broad for this application.
- One schema for the browser and a separate Server Action schema: drift risk.
- Form values stored wholesale in Zustand: duplicate ownership.
- Client-only authorization/domain validation: insecure.
- Per-form label/error markup: inconsistent accessibility and behavior.
