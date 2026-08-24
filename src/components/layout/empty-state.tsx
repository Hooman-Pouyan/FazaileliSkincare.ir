import { cn } from "@/lib/utils";

export function EmptyState({
  title, body, action, className,
}: { title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-24 text-center", className)}>
      <span aria-hidden className="h-px w-10 bg-[var(--hairline)]" />
      <p className="text-[19px] font-bold">{title}</p>
      {body && <p className="max-w-[34em] text-[15px] leading-[1.9] text-[var(--stone-text)]">{body}</p>}
      {action}
    </div>
  );
}
