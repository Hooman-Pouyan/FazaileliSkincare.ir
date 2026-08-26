# Setting up Claude Design with this repo

**Date:** 2026-08-24 · Written after actually attempting the connection, so the failures below are observed, not guessed.

---

## First: there are two different things called "Claude Design"

This trips everyone up, and it is why you couldn't find our canvas in your Claude Design account.

|                                   | **The canvas preview** (what we've been using)                                              | **Claude Design** (claude.ai/design)         |
| --------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| What it is                        | An early preview of Claude Design's canvas editor, **packaged inside a published Artifact** | The real product, with accounts and projects |
| Where it lives                    | `claude.ai/code/artifact/…`                                                                 | `claude.ai/design`                           |
| Connected to your Design account? | **No.** None at all.                                                                        | Yes                                          |
| Source of truth                   | `designs/storefront-canvas/*.dc.html` in this repo                                          | A **design-system project** in your account  |
| How it updates                    | I re-seed from the repo files and republish                                                 | `DesignSync` pushes files into the project   |
| Import / export between them      | **Not available while the preview is on**                                                   | —                                            |

So the mockups you've seen are repo-backed and perfectly real — they are just not _in_ Claude Design. Nothing was lost; they were never there.

---

## What I found when I tried to connect

I called the `DesignSync` tool. Verbatim:

```
DesignSync needs design-system authorization, but /design-login requires an
interactive terminal and is not available in this environment. If this is
claude.ai/code, ask the user to use Claude Design's "Send to Claude Code Web"
(which seeds the project into the workspace) or to provide the project files
directly.
```

Three facts follow:

1. **The plumbing exists.** `DesignSync` can list, read and write design-system projects in your account: `list_projects`, `create_project`, `list_files`, `get_file`, `finalize_plan`, `write_files`, `delete_files`.
2. **It needs an authorization this session cannot obtain.** `/design-login` wants an interactive terminal; this is a cloud session driven from the desktop app.
3. **The error names the supported workaround**: use **"Send to Claude Code Web"** from inside Claude Design, which seeds the project into the workspace.

Also worth knowing: the companion **`/design-sync` skill is not installed on your account.** I searched. `DesignSync` is designed to be driven by it.

---

## The three ways forward, in order of preference

### Option A — "Send to Claude Code Web" _(recommended)_

1. Open **claude.ai/design** and create a project. **Its type must be `Design System`** — that type is fixed at creation and a regular project can never be converted into one.
   Suggested name: **Fazaieli Design System**.
2. From that project, use **"Send to Claude Code Web."** It seeds the project into the session workspace, which is what supplies the authorization `/design-login` would otherwise provide.
3. From then on I can `list_files`, diff against this repo, `finalize_plan`, and `write_files` — pushing components **one at a time**, never as a wholesale replace.

### Option B — Run `/design-login` in a real terminal

Open Claude Code in an actual terminal on your Mac, in this repo, run `/design-login`, complete the browser flow. Afterwards a session with the same login can use `DesignSync` directly. This is the route if you prefer to drive it yourself.

### Option C — Carry on without it

Honestly: **nothing is blocked.** The design system already lives in the repo as `designs/tokens.json` + `tokens.css`, and the canvas artboards live as `.dc.html`. Claude Design would give you a hosted, browsable component gallery your future collaborators can see — nice, not necessary. Do it when the component library actually exists (end of Phase 1), not before.

---

## Skills to add to your account

| Skill                                                                                                     | Why                                                                           | Status                                                                                                                     |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **`design-sync`**                                                                                         | The companion to the `DesignSync` tool — drives the incremental push properly | ❌ **Not installed — add this one**                                                                                        |
| `ui-ux-pro-max`                                                                                           | Design-system search, 119 UX guidelines, stack rules, pre-delivery checklist  | ✅ Installed (thank you — it's already in use, see `10-design-playbook.md`)                                                |
| `context7-mcp` / `find-docs`                                                                              | Current API docs instead of stale training data                               | ✅ Installed, ⚠️ **but `context7.com` is blocked by this session's egress allowlist.** Allowlist it and it starts working. |
| `design` plugin (`design-critique`, `design-system`, `accessibility-review`, `design-handoff`, `ux-copy`) | Review passes on finished screens                                             | ✅ Installed                                                                                                               |

---

## What a design-system project actually expects

Worth knowing before we build the bundle, because the format is specific:

- Each component is a **preview HTML file** under a path like `components/button/index.html`.
- **The first line must carry a card marker**, which is what the Design System pane indexes:
  ```html
  <!-- @dsCard group="Actions" -->
  ```
  The app's self-check compiles those markers into `_ds_manifest.json`. Explicit `register_assets` calls are legacy and unnecessary when the marker is present.
- `group` is a free-form section label. Ours would be: `Foundations` · `Type` · `Colour` · `Actions` · `Forms` · `Navigation` · `Commerce` · `Booking`.
- Writes are **plan-gated**: `finalize_plan` locks the exact paths and the local directory, returns a `planId`, and every subsequent write must fall inside it. You see the path list and the source directory before approving.

### The bundle we would push

```
design-system/
  foundations/
    colour.html          <!-- @dsCard group="Foundations" -->   swatches + measured contrast
    type.html            <!-- @dsCard group="Foundations" -->   FA + Latin specimens, the scale
    space-radius.html    <!-- @dsCard group="Foundations" -->
    motion.html          <!-- @dsCard group="Foundations" -->
  components/
    button.html          <!-- @dsCard group="Actions" -->       variants × sizes × states
    field.html           <!-- @dsCard group="Forms" -->         label, input, error, helper
    rail.html            <!-- @dsCard group="Navigation" -->    the 56px rail, RTL and LTR
    command.html         <!-- @dsCard group="Navigation" -->
    product-tile.html    <!-- @dsCard group="Commerce" -->      borderless, no shadow
    price.html           <!-- @dsCard group="Commerce" -->      rial→toman, Persian digits
    facet-rail.html      <!-- @dsCard group="Commerce" -->      with live counts
    slot-strip.html      <!-- @dsCard group="Booking" -->       Jalali week strip
```

Every one of those renders from `designs/tokens.css`, so the gallery and the app cannot drift.

---

## The rule that keeps this from becoming a second source of truth

> **`designs/tokens.json` in this repo is the source of truth. Always.**

Claude Design is a **mirror** — a hosted gallery for looking at and sharing. It is never the origin of a token value. The flow is one-directional:

```
tokens.json → tokens.css → components → design-system bundle → Claude Design project
```

If a colour changes in the Claude Design UI, that change is not real until it is made in `tokens.json` and pushed back through. Two sources of truth for a design system is how palettes rot.

---

## Code references for whoever picks this up

| What                                          | Where                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| Tokens, source of truth                       | `designs/tokens.json`                                                       |
| Generated CSS + Tailwind `@theme`             | `designs/tokens.css`                                                        |
| Palette rationale, measured contrast          | `designs/design-language/index.html`, `docs/04-information-architecture.md` |
| Brand, voice, audience, what to avoid         | `docs/09-brand-brief.md`                                                    |
| shadcn setup, component rules, RTL, checklist | `docs/10-design-playbook.md`                                                |
| Draft artboards                               | `designs/storefront-canvas/*.dc.html` + `canvas.json`                       |
| Competitor evidence behind the decisions      | `docs/08-competitive-research.md`                                           |
| House conventions                             | `AGENTS.md`                                                                 |

---

## What I'd actually do

**Now:** nothing. The repo is the design system and it works.

**End of Phase 1**, once real components exist: create the `Design System` project, use "Send to Claude Code Web", and push the bundle above. At that point the gallery is showing something true instead of something aspirational — and a hosted component gallery is worth having precisely when there are components to put in it.
