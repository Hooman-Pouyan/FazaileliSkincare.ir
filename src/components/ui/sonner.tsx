"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

type LogicalToasterProps = Omit<ToasterProps, "dir" | "position"> & {
  readonly dir: "ltr" | "rtl";
};

function Toaster({ dir, ...props }: LogicalToasterProps) {
  return (
    <Sonner
      theme="light"
      position={dir === "rtl" ? "bottom-right" : "bottom-left"}
      dir={dir}
      toastOptions={{
        style: {
          background: "var(--surface)",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-control)",
          color: "var(--ink)",
          fontFamily: "var(--font-fa)",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
