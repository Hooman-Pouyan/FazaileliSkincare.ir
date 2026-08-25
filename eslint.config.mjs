import nextVitals from "eslint-config-next/core-web-vitals";

const restrictedPhysicalClass = /\b(?:ml|mr|pl|pr|left|right|text-left|text-right)-/;

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
            "Use logical properties (ms-/me-/ps-/pe-/text-start/inset-inline-*). Persian is the primary locale.",
        },
        {
          selector: `TemplateElement[value.raw=/${restrictedPhysicalClass.source}/]`,
          message:
            "Use logical properties (ms-/me-/ps-/pe-/text-start/inset-inline-*). Persian is the primary locale.",
        },
      ],
    },
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
