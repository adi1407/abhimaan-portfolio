/**
 * Extract the /work film into stills so the scroll scrub is frame-perfect
 * instead of fighting video seek latency.
 *
 * The ffmpeg/ffprobe binaries come from devDependencies, so nothing has to be
 * installed on PATH:
 *
 *   npm run film:frames
 *   npm run film:frames -- --src public/abhi.mp4 --frames 250 --trim 0
 *
 * Writes public/film-frames/frame-001.webp … and manifest.json. WorkFilm
 * fetches that manifest and switches from <video> seeking to image scrub.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const flag = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const src = join(root, flag("src", "public/abhi.mp4"));
const frames = Number(flag("frames", 250));
/** Seconds to drop off the end, for clips that trail into a fade or a card. */
const trim = Number(flag("trim", 0));
const width = Number(flag("width", 1280));
/** libwebp quality. `drawing` preset suits the illustrated film. */
const quality = Number(flag("quality", 68));

const outDir = join(root, "public", "film-frames");

if (!existsSync(src)) {
  console.error(`Missing video: ${src}`);
  process.exit(1);
}
if (!Number.isInteger(frames) || frames < 2) {
  console.error(`--frames must be an integer >= 2, got ${frames}`);
  process.exit(1);
}

const probe = spawnSync(
  ffprobeStatic.path,
  [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    src,
  ],
  { encoding: "utf8" },
);

if (probe.status !== 0) {
  console.error("ffprobe failed:\n", probe.stderr || probe.error);
  process.exit(1);
}

const duration = Number.parseFloat(probe.stdout.trim());
if (!Number.isFinite(duration) || duration <= trim) {
  console.error(`Invalid duration ${probe.stdout.trim()} against trim ${trim}`);
  process.exit(1);
}

const usable = duration - trim;
const fps = (frames / usable).toFixed(6);

// Stale stills from a previous source would silently mix into the scrub.
if (existsSync(outDir)) {
  for (const file of readdirSync(outDir)) {
    if (file.endsWith(".webp")) rmSync(join(outDir, file));
  }
}
mkdirSync(outDir, { recursive: true });

console.log(
  `${basename(src)} — ${duration.toFixed(3)}s, using ${usable.toFixed(3)}s\n` +
    `extracting ${frames} frames @ ${fps} fps, ${width}px wide, webp q${quality}…`,
);

const extract = spawnSync(
  ffmpegPath,
  [
    "-y",
    "-i",
    src,
    "-t",
    String(usable),
    "-vf",
    `fps=${fps},scale=${width}:-1:flags=lanczos`,
    "-frames:v",
    String(frames),
    // Naming the encoder is what makes the sequence muxer below take effect;
    // left to its own devices ffmpeg picks the animated-WebP path instead.
    "-c:v",
    "libwebp",
    "-q:v",
    String(quality),
    "-compression_level",
    "6",
    "-preset",
    "drawing",
    // Without this, ffmpeg reads the .webp extension as "animated WebP" and
    // muxes every frame into one 6 MB file instead of honouring %03d.
    "-f",
    "image2",
    join(outDir, "frame-%03d.webp"),
  ],
  { encoding: "utf8" },
);

if (extract.status !== 0) {
  console.error("ffmpeg failed:\n", extract.stderr || extract.error);
  process.exit(1);
}

// Trust the disk, not the request: rounding the fps can land a frame short and
// a manifest that overcounts would ask the browser for a 404 at the very end.
const written = readdirSync(outDir).filter((f) => f.endsWith(".webp"));
if (written.length === 0) {
  console.error("ffmpeg reported success but wrote no frames.");
  process.exit(1);
}

const bytes = written.reduce(
  (sum, f) => sum + statSync(join(outDir, f)).size,
  0,
);

const manifest = {
  count: written.length,
  pattern: "/film-frames/frame-{i}.webp",
  pad: 3,
  // ffmpeg numbers from 001, so WorkFilm maps scrub index 0 onto frame-001.
  indexBase: 1,
  source: basename(src),
};

writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(
  join(outDir, "README.md"),
  `# Film frame cache

Generated — do not hand-edit. Rebuild with:

\`\`\`bash
npm run film:frames
\`\`\`

| | |
|---|---|
| Source | \`public/${basename(src)}\` |
| Duration used | ${usable.toFixed(3)}s of ${duration.toFixed(3)}s (trim ${trim}s) |
| Frames | ${written.length} |
| Size | ${width}px wide, webp q${quality} |
| Total | ${(bytes / 1024 / 1024).toFixed(1)} MB |

[\`WorkFilm\`](../../src/features/work/components/work-film.tsx) fetches
\`manifest.json\` and switches to image scrub, pulling each still on demand as
you scroll. Without the manifest it falls back to \`<video>\` seeking and builds
an in-memory \`ImageBitmap\` cache instead.
`,
);

console.log(
  `wrote ${written.length} frames (${(bytes / 1024 / 1024).toFixed(1)} MB, ` +
    `~${Math.round(bytes / written.length / 1024)} KB each) + manifest`,
);
