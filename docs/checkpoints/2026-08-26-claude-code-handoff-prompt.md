read this handoff and readd all the impelmentations phased plan docs and review and techincal decions docs and the current WIP pakcets and tasks for landing and pdp etc and ingest and study our design system and it's artifcats in the zip fodler or html in the design system directy and this is a MUST docs/29-handoff.md (472fae6), and linked from docs/README.md

You're taking over fazaieli.ir — a Persian-first storefront, booking and academy for a skincare institute in Mashhad. The repo is on the maintainer's machine, reachable through the Cowork device bridge at $HOME/mnt/FazaileliSkincare.ir. Branch develop, HEAD 472fae6.

Start by reading docs/29-handoff.md end to end. Then AGENTS.md, then docs/17-execution-ledger.md — which carries the queue and a generated register of everything waiting on the maintainer. Then read the last fourteen commits (git log 795925b..HEAD); the messages carry reasoning and several recorded mistakes worth not repeating.

Do not start work until you've read the decision docs for whatever you're about to touch. They're numbered and cited from the code that implements them.What's in it
Read order — six files, in sequence, with why each one
What was built this session — packets 7B and 6, the governing decisions (C-1 truth is per field; C-12 specific replaces generic; E-1 parallax adopted with constraints; E-3 testimonials and the medical-claim split)
The four gates and why deleting one to make something pass is never the answer — with the specific dead Tailwind spellings that have now bitten four times
Environment realities — no database on the device VM, the mount refuses deletion, the git lock dance, the exact commands, and the run-and-paste loop that has caught three real defects
Your six standing instructions, stated as rules rather than preferences: no drift, no hand-rolling, broadcast before adopting, capture everything, SEO is first-class, never invent a fact about the business
What's next — close packet 6, then the R-9 curl that either reclassifies or dismisses the SSR question, then the refinement backlog with density first
Traps — including that the uncommitted favicon/logo/rail work in the tree isn't mine and shouldn't be committed without asking you

you're supposed to follow up on the tasks and pakcets and todos list items form the rpevious claude agent session and iv'e attached the hand off it provided for you and it's concversation transcript adn it ahs dcouemnt every detail and made decions and refinemtns and adjustments and product alignments and tehncia ldirections and instructions and my inputs and implemntations phased plan docs and markdowns for the current ongoing packets for nading, php, plp, pdp etc in the repo /docs and design system alsi is a requried context you should ingest and bring yourself up to speed with

the project was fazaieliskincare.ir and sessiontitle was Codex agent implementation status in the exprot json and url for the cladues session transcripts so you have precise and comrpehsicve context to continue it's work and todolsit items nad packets

I'll start by ingesting everything — the repo docs, the handoff, the ledger, the commits, and the design system.

Ran 4 commands, read 4 files

This changes the top of the plan: the environment constraints in the handoff (§5 — no Docker, no Postgres, cloud bridge) no longer apply. Let me verify what's actually live and settle R-9 immediately, since it's the branch point for everything.

Checked env, dev server, and ran the R-9 SSR curl

R-9 is answered — and it dismisses, not escalates. Let me confirm the content is in real markup rather than only the RSC flight payload, since that distinction is the whole point of the question.

Ran 2 commands

R-9 resolved: catalogue tiles are real server markup (24 <article> survive script-stripping), and BreadcrumbList + ItemList(47) + FAQPage JSON-LD all emit in the initial document. Now the design system, which you flagged as mandatory.

Ran 3 commands, read 3 files

Now let me establish a hard baseline — the four gates and the unit suite, which the previous session could run but never against this full environment.

Ran 4 commands

Two things surfaced. Let me pin down the lint failure — whether it's source or scratch directories.

Ran 2 commands

src/ and scripts/ lint clean — all 378 lint errors come from .agent-tmp/, a 2.4 GB untracked scratch dir that's gitignored but missing from eslint's ignore list. CI passes on a fresh checkout; locally the gate is unusable. Let me check the other loose ends.

Ran 2 commands

The uncommitted work is a coherent brand identity pass — real logo artwork replacing the hand-drawn CSS medallion, with its test updated. Typecheck and all 352 tests pass with it in the tree. Let me verify its assets resolve, then do the browser pass that packet 6's exit gate requires.

Verified brand artwork assets exist and are tracked

All assets resolve and are tracked. Now the browser pass — packet 6's outstanding exit gate (6.11, 4.11, 5.8, 7.11 all say "never rendered in a browser").

Mahdieh Fazaieli — Specialist skincare academy in Mashhad | Mahdieh Fazaieli
localhost:3000 · Opened in Browser
Used 2 tools

The browser is rendering / in English, but curl returned Persian. That's locale negotiation on the unprefixed route — let me test it precisely, because R-2 makes / the Persian canonical.

Ran 2 commands

/ serves 200 Persian with no Accept-Language, but 307-redirects to /en for any English client — including Googlebot sending Accept-Language: en. Let me check how that's configured, then force Persian for the browser pass.
