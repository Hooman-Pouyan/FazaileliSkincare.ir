# Component name

**Status:** Draft | Accepted | Deprecated  
**Owner:** Generic UI | Layout | `<module>`  
**Implemented at:** `src/...`  
**Last verified:** YYYY-MM-DD

> Copy this file when a reusable component needs a public contract. Delete sections that genuinely do not apply; do not leave placeholders in an accepted document.

## Purpose

State the customer or implementation problem the component solves in one paragraph. Name whether it is a primitive, composition, or feature-local component.

## When to use

- Name the intended situations.
- Name the owning routes or feature families where useful.

## When not to use

- Name the closest alternatives and the decision boundary.
- Identify visually similar components with different semantics.

## Ownership and dependencies

- Canonical source file and exports.
- Generic or feature-local ownership.
- Primitives, tokens, module state, URL state, form state, and server models consumed.
- State explicitly whether the component is presentational or a smart client leaf.

## Interface

Document the stable props/events and required child composition. Prefer a small TypeScript signature. Explain controlled/uncontrolled behavior and defaults. Do not expose styling or state escape hatches without a current use case.

## Anatomy

List the semantic parts in DOM/reading order: label, control, description, content, error, actions, status, and so on.

## States

Cover every applicable state:

- default, hover, focus-visible, active/pressed/selected;
- disabled and read-only;
- pending/loading;
- valid empty;
- validation/domain error;
- operational error;
- unavailable/restricted;
- reduced motion.

State which layer owns each state. Do not use one visual state for several different domain meanings.

## Behavior

- Mouse, touch, keyboard, and focus behavior.
- Controlled transitions and emitted events.
- URL, Zustand, form, or Query integration where applicable.
- Dismissal, focus restoration, history, and pending behavior.

## Persian, RTL, and mixed direction

- Persian source-copy requirements.
- Logical alignment and direction-sensitive icons.
- Long-copy and wrapping behavior.
- LTR identifiers/URLs/phone/SKU isolation.
- Numeral, money, and date formatting through canonical utilities.

## Responsive behavior

Describe mobile, tablet, and desktop composition differences. Avoid encoding page-specific widths into a generic primitive. Interactive targets remain at least 44px.

## Accessibility

- Semantic element/role and accessible name.
- Label, description, error, and status relationships.
- Keyboard interaction and focus order.
- Screen-reader announcements.
- Contrast, target size, motion, and non-color indicators.
- Dialog/sheet focus trap and restoration where relevant.

## Visual contract

Name the token families and brand rules: hairlines instead of shadows, permitted radii, light/dark fields, and prohibited dashboard/card treatments. Do not paste screenshot-derived pixel values as authority.

## Examples

Provide the smallest canonical examples, including one non-happy state when that state materially changes usage. Examples use Persian-first content.

## Tests and evidence

- Unit/component scenarios.
- Module or browser journeys.
- Required viewports.
- RTL, keyboard, screen-reader, reduced-motion, and visual evidence.
- Date of the last manual verification.

## Escape hatches and rejected alternatives

Record the narrow escape hatch, its approved consumer, and why normal composition is insufficient. Record rejected alternatives when future contributors are likely to reconsider them.

## Related contracts

Link the owning architecture, page plan, accessibility rule, tokens, and adjacent components.
