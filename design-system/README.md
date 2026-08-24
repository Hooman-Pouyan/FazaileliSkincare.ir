# Design-system bundle → Claude Design

Preview files for pushing into a **Claude Design design-system project**. Each file's **first line** carries the card marker the Design System pane indexes:

```html
<!-- @dsCard group="Foundations" -->
```

Explicit `register_assets` calls are unnecessary when the marker is present — the app's self-check compiles them into `_ds_manifest.json`.

## Contents

| File | Card group | What it shows |
|---|---|---|
| `foundations/colour.html` | Foundations | Every token with its **measured** contrast ratio on light ground and on ink, plus the text-safe variants |
| `foundations/type.html` | Foundations | Persian and Latin specimens, the type scale, the 1.8 line-height rule |
| `foundations/space-radius.html` | Foundations | The 10-step scale, two radii, hairlines-not-shadows |
| `foundations/motion.html` | Foundations | One duration, one easing, permitted and forbidden lists |

**Foundations only, deliberately.** These four are *finished* — the tokens are measured and settled. Components are not built yet, and a gallery showing aspirational components is worse than one showing four true things. Add `components/` after Phase 1.

## Pushing it

This must run from a terminal where `/design-login` has completed — a cloud session cannot obtain that authorization.

1. Create a project at **claude.ai/design**. **Type must be `Design System`** — that is fixed at creation and a normal project can never be converted.
2. In a local terminal, in this repo, run Claude Code and ask it to sync `design-system/` into that project. It will `list_files`, diff, `finalize_plan` (you approve the exact paths and the source directory), then `write_files`.
3. Adding the **`design-sync` skill** to your account first makes this smoother — it is the companion to the `DesignSync` tool.

## The rule

**`designs/tokens.json` is the source of truth. This bundle is a mirror.**

```
tokens.json → tokens.css → components → design-system/ → Claude Design project
```

A colour changed in the Claude Design UI is not real until it is changed in `tokens.json` and pushed back through. Two sources of truth is how palettes rot.

## Regenerating

These files inline the token values so they render standalone in the Design System pane. When `tokens.json` changes, the `:root` block in each file must be updated to match — ask Claude to regenerate the bundle rather than hand-editing four files.
