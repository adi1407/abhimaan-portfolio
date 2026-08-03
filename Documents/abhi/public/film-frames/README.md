# Film frame cache

Generated — do not hand-edit. Rebuild with:

```bash
npm run film:frames
```

| | |
|---|---|
| Source | `public/abhi.mp4` |
| Duration used | 10.006s of 10.006s (trim 0s) |
| Frames | 250 |
| Size | 1280px wide, webp q68 |
| Total | 11.0 MB |

[`WorkFilm`](../../src/features/work/components/work-film.tsx) fetches
`manifest.json` and switches to image scrub, pulling each still on demand as
you scroll. Without the manifest it falls back to `<video>` seeking and builds
an in-memory `ImageBitmap` cache instead.
