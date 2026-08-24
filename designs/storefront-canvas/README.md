# Storefront canvas — source artboards

Draft mockups for the landing page and shop. **Not approved** — drafted before competitor references and a feature list were available, and due for a rework.

| File | Screen |
|---|---|
| `Main.dc.html` | Landing — 1440×3320 |
| `Shop.dc.html` | Shop, concern-first browse — 1440×2160 (the concern row is interactive) |
| `Product.dc.html` | Product page, editorial spread — 1440×1980 |
| `Checkout.dc.html` | Bank-transfer checkout — 1440×1420 |
| `Mobile.dc.html` | Landing on mobile — 390×1560 |
| `canvas.json` | Layout, titles and canvas notes |

All artboards are Persian RTL on the sampled brand palette (see `../design-language/index.html`).

## What is placeholder

- **Prices are samples.** Replace from the real price list.
- **Grey and sand blocks are photography placeholders.**
- **`[براکت]` marks a fact not yet known** — years of experience, student count, address, landline, card number.
- The footer reserves a slot for the eNamad badge; the product page reserves one for IRC / authenticity.

## Format

Each `.dc.html` is a self-contained Design Component: a `<x-dc>` template with inline styles, plus an optional `<script data-dc-script>` logic class. They render as artboards on one pan/zoom canvas. Keep the `<script src="./support.js">` head line exactly as it is — it is replaced with an inline runtime at render time.

The published canvas is generated from these files; the ~2 MB generated output is intentionally not committed.
