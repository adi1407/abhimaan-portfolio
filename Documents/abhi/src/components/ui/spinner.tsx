import { cn } from "@/lib/cn";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <span
        className="size-5 animate-spin rounded-full border-2 border-foreground/25 border-t-foreground"
        aria-hidden
      />
      <span className="font-dm-sans text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
