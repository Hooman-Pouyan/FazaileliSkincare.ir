# Brand asset system

The website uses one primary medallion, one compact derived glyph, and one optional editorial divider. These are local raster assets because the supplied originals are raster; no generated SVG should be presented as a true vector master.

## Production files

| Role              | Files                                                                      | Intended use                                                                                                 |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Primary medallion | public/images/brand/brand-medallion-1024.png, -512.png, -256.png, -128.png | Main institutional identity, rail, About, Academy credentials, and high-trust brand moments                  |
| Compact glyph     | public/images/brand/brand-glyph-512.png, -256.png, -128.png, -64.png       | Tight navigation, small branded accents, and places where the medallion's calligraphy would become illegible |
| Editorial divider | public/images/brand/brand-divider-1536x256.png, -960x160.png, -600x100.png | Optional transition between major editorial chapters on deep lapis or ink fields                             |

All files are lossless PNGs with real alpha transparency and contain no foreign-host dependency.

## Usage rules

### Primary medallion

- Preserve the supplied calligraphy, dot count, ring geometry, and colors. Do not redraw, recolor, rotate, crop, add glow, or add shadow.
- Use at 72 CSS pixels or larger. Select the smallest source file that is at least twice the rendered CSS size on high-density displays.
- Keep clear space of at least one perimeter-dot diameter around the visible circle.
- When the logo is the only identity in a region, use Persian alternative text: «مؤسسه مهدیه فضائلی». When adjacent text already names the institute, use an empty alt attribute to avoid repetition.

### Compact glyph

- Use when the available size is below 72 CSS pixels or the full medallion would compete with content.
- The practical minimum is 24 CSS pixels high; 32–48 pixels is preferred.
- It is a secondary web mark, not a substitute for the medallion on certificates, legal documents, invoices, or formal partnership material.
- Gold and firouzeh are dark-field colors. Prefer ink or deep-lapis ground and do not add a white badge behind the glyph.

### Editorial divider

- Treat the divider as decorative and use an empty alt attribute.
- Use only between major page chapters, normally no more than once on a short page and twice on a long editorial page.
- Prefer the 600-pixel file on narrow screens, 960-pixel file for normal content columns, and 1536-pixel master only for wide/full-bleed compositions.
- Do not use it between cards, list items, form fields, product tiles, or ordinary sections.
- For responsive application UI, the preferred implementation is the compact glyph centered over a CSS hairline using the existing hairline/gold tokens. The wide PNG is best for editorial content, exported artwork, and contexts where a single image asset is required.

## Provenance

- The medallion is a pixel-preserving extraction from codex-clipboard-b4e40cf5-d024-4aee-ab1b-600614734147.png. Source SHA-256: 657e24a76c81d4306d3128841308b3b666614dd055a2d186dbbccd8162ca7742.
- The compact glyph is an AI-assisted cleanup of the supplied tight mark and divider references, followed by deterministic alpha/fringe cleanup and lossless resizing.
- The divider is a deterministic composition of the compact glyph and gold-light hairline from the accepted design palette.
