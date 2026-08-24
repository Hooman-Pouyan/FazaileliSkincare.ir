# Fonts — self-hosted, always

Two files belong here. They are **not** fetched at runtime: from Iranian
infrastructure a request to `fonts.googleapis.com` hangs and takes the
whole stylesheet down with it.

| File | Face | Source |
|---|---|---|
| `Vazirmatn[wght].woff2` | Persian body + display, variable 100–900 | github.com/rastikerdar/vazirmatn (releases → `Vazirmatn-Variable-font-face`) |
| `BodoniModa[opsz,wght].woff2` | Latin display only | fonts.google.com/specimen/Bodoni+Moda → download family, convert the variable TTF to woff2 |

Until they are present the app falls back to system faces and still builds —
it just doesn't look like the brand.
