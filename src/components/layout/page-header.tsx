import { cn } from "@/lib/utils";
import { Container } from "./container";

export function PageHeader({
  eyebrow, title, lede, className, children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Container className={cn("flex flex-col gap-4 pt-16", className)}>
      {eyebrow && (
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--gold-text)]">{eyebrow}</p>
      )}
      <h1 className="text-[clamp(1.9rem,4vw,3.5rem)] font-black leading-[1.32] text-balance">{title}</h1>
      {lede && (
        <p className="max-w-[36em] text-[17px] leading-[1.95] text-[var(--stone-text)]">{lede}</p>
      )}
      {children}
    </Container>
  );
}
