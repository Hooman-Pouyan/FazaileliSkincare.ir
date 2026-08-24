import next from "eslint-config-next";

export default [
  ...next(),
  {
    rules: {
      // House rule (AGENTS.md): logical properties only — RTL is the primary locale.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\\\b(ml|mr|pl|pr|left|right|text-left|text-right)-/]",
          message:
            "Use logical properties (ms-/me-/ps-/pe-/text-start/inset-inline-*). Persian is the primary locale.",
        },
      ],
    },
  },
];
