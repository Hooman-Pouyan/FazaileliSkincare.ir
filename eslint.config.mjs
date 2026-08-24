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
];

export default eslintConfig;
