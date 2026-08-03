"use client";

import { cn } from "@/lib/cn";
import { useInView } from "@/hooks/use-in-view";

type SplitTextProps = {
  children: string;
  className?: string;
  id?: string;
  /** Per-unit stagger in ms. */
  stagger?: number;
  /** Delay before the first unit animates, in ms. */
  delay?: number;
  /** Chars give a tighter ripple; words read calmer on long copy. */
  by?: "char" | "word";
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
};

/**
 * Masked rise-in reveal. Each unit sits in an overflow-hidden box and
 * translates up from below on enter. The full string stays in the
 * accessibility tree via aria-label; the pieces are hidden from it.
 */
export function SplitText({
  children,
  className,
  id,
  stagger = 26,
  delay = 0,
  by = "char",
  as: Tag = "span",
}: SplitTextProps) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const words = children.split(" ");
  let unit = 0;

  return (
    <Tag
      ref={ref as never}
      id={id}
      className={cn("split", className)}
      aria-label={children}
    >
      {words.map((word, wi) => (
        <span key={`${word}-${wi}`} className="split__word" aria-hidden>
          {by === "word" ? (
            <span
              className={cn("split__unit", inView && "is-in")}
              style={{ transitionDelay: `${delay + unit++ * stagger}ms` }}
            >
              {word}
            </span>
          ) : (
            word.split("").map((char, ci) => (
              <span
                key={`${char}-${ci}`}
                className={cn("split__unit", inView && "is-in")}
                style={{ transitionDelay: `${delay + unit++ * stagger}ms` }}
              >
                {char}
              </span>
            ))
          )}
          {wi < words.length - 1 ? <span className="split__space"> </span> : null}
        </span>
      ))}
    </Tag>
  );
}
