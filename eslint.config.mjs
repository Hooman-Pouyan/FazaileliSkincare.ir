import nextVitals from "eslint-config-next/core-web-vitals";

const restrictedPhysicalClass =
  /\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/;

/**
 * CSS property names that read like Tailwind utilities and are not. Tailwind
 * has no `inset-inline-*`, `inset-block-*` or `border-inline-*` utilities, so
 * these compile to nothing at all — silently. Several shipped in packet 4 and
 * left the rail and the mobile bar `fixed` with no offsets.
 *
 * `src/lib/design/tailwind-candidates.test.ts` is the general gate for dead
 * classes; this rule is the fast one, and it exists because the message below
 * used to recommend the very spelling that does not work.
 */
const cssPropertyAsClass =
  /\b(?:inset-inline|inset-block|border-inline|border-block|margin-inline|margin-block|padding-inline|padding-block)-/;

const eslintConfig = [
  ...nextVitals,
  {
    ignores: [".tmp-app2/**", ".tmp-app3/**"],
  },
  {
    rules: {
      // House rule (AGENTS.md): logical properties only — RTL is the primary locale.
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${restrictedPhysicalClass.source}/]`,
          message:
            "Use logical properties (ms-/me-/ps-/pe-/start-/end-/text-start). Persian is the primary locale.",
        },
        {
          selector: `TemplateElement[value.raw=/${restrictedPhysicalClass.source}/]`,
          message:
            "Use logical properties (ms-/me-/ps-/pe-/start-/end-/text-start). Persian is the primary locale.",
        },
        {
          selector: `Literal[value=/${cssPropertyAsClass.source}/]`,
          message:
            "Tailwind has no such utility and this compiles to nothing. Use start-/end-/inset-x-/inset-y-/border-s/border-e; for the block axis use top-/bottom-.",
        },
        {
          selector: `TemplateElement[value.raw=/${cssPropertyAsClass.source}/]`,
          message:
            "Tailwind has no such utility and this compiles to nothing. Use start-/end-/inset-x-/inset-y-/border-s/border-e; for the block axis use top-/bottom-.",
        },
      ],
    },
  },
  {
    // This test asserts that the dead spellings are dead. Naming them is the
    // assertion, so the rule that forbids them has to stand aside here — and
    // only here. Recorded rather than hidden in an inline disable.
    files: ["src/lib/design/tailwind-candidates.test.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // `global-not-found.tsx` is returned at the routing level and bypasses the
    // layout tree entirely, so the App Router context `next/link` needs is not
    // established. A plain anchor is also the correct behaviour here rather than
    // a concession: leaving a 404 has no app shell worth preserving, and a full
    // document load is what should happen. The rule cannot know that, so the
    // exception is recorded here instead of hidden in an inline disable.
    files: ["src/app/global-not-found.tsx"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
];

export default eslintConfig;
