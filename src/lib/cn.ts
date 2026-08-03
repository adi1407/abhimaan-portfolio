type ClassValue = string | false | null | undefined;

/** Lightweight className joiner — no extra deps. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
