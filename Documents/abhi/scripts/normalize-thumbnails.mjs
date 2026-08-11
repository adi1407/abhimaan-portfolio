/**
 * One-shot: rename + convert public/thumbnails/*.jpg → kebab-case WebP.
 *
 *   node scripts/normalize-thumbnails.mjs --dry
 *   node scripts/normalize-thumbnails.mjs
 *
 * Dedupes by file size (keep the named source, drop numeric twins).
 * Quality 90 / max edge 1920 — YouTube-thumb native, no visible downgrade.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry");
const DIR = path.resolve("public/thumbnails");
const QUALITY = 90;
const MAX_EDGE = 1920;

/** Explicit old filename → slug (no extension). */
const MAP = {
  "godz-thumbnail.jpg": "godlike-bgis",
  "AK-THUMBNAIL-FINAL.jpg.jpeg": "abhishek-kar",
  "ABHISHEK-KAR-PODCAST2.jpg": "abhishek-kar-podcast",
  "carry-fake-taxi-thumb (1).jpg": "carry-fake-taxi",
  "JELLY THUMBNAIL.jpg.jpeg": "jelly",
  "jelly yhumb with out cc.jpg": "jelly-alt",
  "ATTANKI PAAJI FNL WITH CC.jpg": "attanki-paaji",
  "HYDRO THUMBNAIL WITH CC.jpg": "hydro",
  "MANYA BGMI THUMBNAIL WITH CC.jpg": "manya-bgmi",
  "MAZY THUMBNAIL ..jpg.jpeg": "mazy",
  "ZAP THUMBNAIL CC.jpg": "zap",
  "jonny-live-thumbnail.jpg": "jonny-live",
  "Gyan-therapy.jpg": "gyan-therapy",
  "admino crate opening cc.jpg": "admino-crate",
  "mvlxzNsE2ss-HD.jpg": "stream-cut",
  "000001.jpg": "series-01",
  "000002.jpg": "series-02",
  "000003.jpg": "series-03",
  "000004.jpg": "series-04",
  // 000005 twin of hydro — skipped via size dedupe
  "000005.jpg": "hydro",
  // 000006 twin of admino — skipped via size dedupe
  "000006.jpg": "admino-crate",
  "000007.jpg": "series-07",
  "000008.jpg": "series-08",
  "000009.jpg": "series-09",
  "0000010.jpg": "series-10",
};

/** Prefer named file over numeric when sizes collide. */
function preferName(a, b) {
  const aNum = /^00000/.test(a);
  const bNum = /^00000/.test(b);
  if (aNum && !bNum) return b;
  if (bNum && !aNum) return a;
  return a.length <= b.length ? a : b;
}

const titleFromSlug = (slug) =>
  slug
    .split("-")
    .map((w) => {
      if (w === "bgis" || w === "bgmi" || w === "hd") return w.toUpperCase();
      if (w === "alt") return "Alt";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ")
    .replace(/^Godlike /, "GodLike ")
    .replace(/^Abhishek Kar$/, "Abhishek Kar")
    .replace(/^Series (\d+)$/, (_, n) => `Series ${n.padStart(2, "0")}`);

const kb = (n) => `${Math.round(n / 1024)}KB`;

async function run() {
  const entries = await readdir(DIR);
  const images = entries.filter((n) => /\.(jpe?g|png|webp)$/i.test(n));

  // Size → best filename (dedupe twins)
  const bySize = new Map();
  for (const name of images) {
    const s = await stat(path.join(DIR, name));
    if (!s.isFile()) continue;
    const prev = bySize.get(s.size);
    bySize.set(s.size, prev ? preferName(prev, name) : name);
  }

  const keep = new Set(bySize.values());
  const drop = images.filter((n) => !keep.has(n) && /\.(jpe?g|png)$/i.test(n));

  console.log(`keep ${keep.size} · drop ${drop.length} duplicates\n`);

  if (!DRY) {
    for (const name of drop) {
      await unlink(path.join(DIR, name));
      console.log(`deleted duplicate  ${name}`);
    }
  } else {
    for (const name of drop) console.log(`would delete duplicate  ${name}`);
  }

  const items = [];
  let before = 0;
  let after = 0;
  const usedSlugs = new Set();

  for (const name of [...keep].sort()) {
    if (/\.webp$/i.test(name)) {
      // Already converted — skip re-encode
      const slug = name.replace(/\.webp$/i, "");
      items.push({ slug, title: titleFromSlug(slug), src: `/thumbnails/${slug}.webp` });
      continue;
    }

    let slug = MAP[name];
    if (!slug) {
      slug = name
        .replace(/\.(jpe?g|png)$/i, "")
        .replace(/\.jpe?g$/i, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .replace(/-?(thumbnail|thumb|fnl|final|with-cc|cc|hd)-?/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    }

    if (usedSlugs.has(slug)) {
      let i = 2;
      while (usedSlugs.has(`${slug}-${i}`)) i += 1;
      slug = `${slug}-${i}`;
    }
    usedSlugs.add(slug);

    const file = path.join(DIR, name);
    const buf = await readFile(file);
    before += buf.length;

    const meta = await sharp(buf).metadata();
    let pipe = sharp(buf, { failOn: "none" });
    if (meta.width && meta.width > MAX_EDGE) {
      pipe = pipe.resize({ width: MAX_EDGE, withoutEnlargement: true });
    }
    const out = await pipe
      .webp({ quality: QUALITY, alphaQuality: 90, effort: 5 })
      .toBuffer();
    after += out.length;

    const target = path.join(DIR, `${slug}.webp`);
    const pct = Math.round(100 - (out.length / buf.length) * 100);
    console.log(
      `${DRY ? "would" : "wrote"}  ${slug}.webp  ${kb(buf.length)} -> ${kb(out.length)}  (-${pct}%)  ← ${name}`,
    );

    if (!DRY) {
      await writeFile(target, out);
      if (path.resolve(target) !== path.resolve(file)) await unlink(file);
    }

    items.push({
      slug,
      title: titleFromSlug(slug),
      src: `/thumbnails/${slug}.webp`,
    });
  }

  items.sort((a, b) => a.slug.localeCompare(b.slug));

  console.log("\n--- WORK_ITEMS seed ---");
  items.forEach((it, i) => {
    console.log(
      `  th-${String(i + 1).padStart(2, "0")}  ${it.title.padEnd(28)}  ${it.src}`,
    );
  });

  const manifest = path.join(DIR, "manifest.json");
  if (!DRY) {
    await writeFile(
      manifest,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          quality: QUALITY,
          maxEdge: MAX_EDGE,
          items,
        },
        null,
        2,
      ),
    );
    console.log(`\nwrote ${path.relative(process.cwd(), manifest)}`);
  }

  if (before) {
    console.log(
      `\ntotal: ${kb(before)} -> ${kb(after)}  (-${Math.round(100 - (after / before) * 100)}%)`,
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
