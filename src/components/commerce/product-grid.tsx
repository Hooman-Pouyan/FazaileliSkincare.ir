import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Grid, not flex — children flow into cells in document order and the gap
 * survives direct manipulation. Column counts are deliberately low: this is a
 * curated catalogue, not a marketplace wall.
 */
export function ProductGrid({
  className,
  columns = 3,
  ...props
}: React.ComponentProps<"div"> & { columns?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-x-[var(--space-6)] gap-y-[var(--space-8)]",
        "grid-cols-2",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
      {...props}
    />
  );
}

/** Reserve space so CLS stays under 0.1. */
export function ProductGridSkeleton({
  count = 6,
  columns = 3,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
}) {
  return (
    <ProductGrid columns={columns}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <Skeleton className="aspect-[4/5] w-full" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </ProductGrid>
  );
}
