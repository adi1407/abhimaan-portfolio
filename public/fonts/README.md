# Local fonts

This folder is empty on purpose.

The site runs on a single typeface, **SF Pro**, and neither half of that stack
is served from here:

- **Apple hardware** resolves SF Pro through the system stack
  (`"SF Pro Display"`, `-apple-system`, `BlinkMacSystemFont`). Apple does not
  license SF Pro as a webfont, so it can never be self-hosted.
- **Everywhere else** gets **Inter**, the stand-in drawn to the same
  proportions. It is declared in `src/app/fonts.ts` and self-hosted
  automatically by `next/font`, which emits it into `.next/static/media` — not
  into `public/`. Nothing is fetched from Google at runtime.

The whole stack is one token, `--font-sf-pro` in `src/app/globals.css`. Every
other `--font-*` token aliases it, so type roles are separated by weight, size
and tracking rather than by family.

## Adding a licensed face later

If a display face is ever licensed for the headline roles:

1. Drop the `.woff2` here.
2. Add an `@font-face` rule at the top of `globals.css`.
3. Point only the tokens that role uses (say `--font-greta`) at the new family
   name, leaving `--font-sf-pro` as the fallback behind it.

Check the licence covers webfont embedding before shipping — several of the
faces previously trialled here (Bestie Seventy among them) were personal-use
only, which does not cover a portfolio that advertises paid work.
