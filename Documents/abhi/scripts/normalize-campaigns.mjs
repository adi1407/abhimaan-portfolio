/**
 * Rename + convert public/abhi{1,2,3,4}/* → kebab-case WebP.
 *
 *   node scripts/normalize-campaigns.mjs --dry
 *   node scripts/normalize-campaigns.mjs
 */
import { readdir, readFile, writeFile, unlink, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry");
const ROOT = path.resolve("public");
const SETS = ["abhi1", "abhi2", "abhi3", "abhi4"];
const QUALITY = 88;
const MAX_EDGE = 2000;

const MAP = {
  "GAME DAY.jpg": "game-day",
  "GODLIKE FINALS DAY ZGOD.jpg": "godlike-finals-zgod",
  "GODLIKE MATCH WALA STOR.jpg": "godlike-match-story",
  "GODLIKE MVP SD.jpg": "godlike-mvp",
  "GODLIKE SD 2.jpg": "godlike-sd-2",
  "MINO ST.jpg": "mino-st",
  "FINAL-TRUE-RIPPER-RED-GROUP-POSTER-DESIGN.jpg": "true-ripper-final-group",
  "TRUE RIPPER 2ND hhghh.jpg": "true-ripper-second",
  "true ripper first pg.jpg": "true-ripper-first",
  "true ripper harsh 3rd.jpg": "true-ripper-harsh",
  "true ripper hydro 2nd.jpg": "true-ripper-hydro",
  "true ripper jelly 4th.jpg": "true-ripper-jelly",
  "true ripper kiolamo 5th.jpg": "true-ripper-kiolamo",
  "true ripper reel psd.jpg": "true-ripper-reel",
  "APEX 0.jpg": "apex-0",
  "APEX-1.jpg": "apex-1",
  "APEX-2.jpg": "apex-2",
  "APEX-3.jpg": "apex-3",
  "APEX-5.jpg": "apex-5",
  "OVERALL-STANDING.jpg": "overall-standing",
};

const titleFromSlug = (slug) =>
  slug
    .split("-")
    .map((w) => {
      if (["mvp", "sd", "st", "pg"].includes(w)) return w.toUpperCase();
      if (w === "zgod") return "ZGod";
      if (w === "godlike") return "GodLike";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");

const kb = (n) => `${Math.round(n / 1024)}KB`;

function slugify(name) {
  if (MAP[name]) return MAP[name];
  return name
    .replace(/\.(jpe?g|png|webp)$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function convertDir(dirName) {
  const dir = path.join(ROOT, dirName);
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    console.warn(`skip missing ${dirName}`);
    return [];
  }

  const images = entries.filter((n) => /\.(jpe?g|png|webp)$/i.test(n));
  const items = [];
  let before = 0;
  let after = 0;
  const used = new Set();

  for (const name of images.sort()) {
    if (/\.webp$/i.test(name)) {
      const slug = name.replace(/\.webp$/i, "");
      items.push({
        id: slug,
        src: `/${dirName}/${slug}.webp`,
        label: titleFromSlug(slug),
      });
      continue;
    }

    let slug = slugify(name);
    if (used.has(slug)) {
      let i = 2;
      while (used.has(`${slug}-${i}`)) i += 1;
      slug = `${slug}-${i}`;
    }
    used.add(slug);

    const file = path.join(dir, name);
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

    const target = path.join(dir, `${slug}.webp`);
    const pct = Math.round(100 - (out.length / buf.length) * 100);
    console.log(
      `${DRY ? "would" : "wrote"}  ${dirName}/${slug}.webp  ${kb(buf.length)} -> ${kb(out.length)}  (-${pct}%)`,
    );

    if (!DRY) {
      await writeFile(target, out);
      if (path.resolve(target) !== path.resolve(file)) await unlink(file);
    }

    items.push({
      id: slug,
      src: `/${dirName}/${slug}.webp`,
      label: titleFromSlug(slug),
    });
  }

  if (before) {
    console.log(
      `  ${dirName} total: ${kb(before)} -> ${kb(after)}  (-${Math.round(100 - (after / before) * 100)}%)\n`,
    );
  }

  const manifest = {
    id: dirName,
    generatedAt: new Date().toISOString(),
    items,
  };
  if (!DRY) {
    await writeFile(
      path.join(dir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
  }
  return items;
}

async function run() {
  const all = {};
  for (const set of SETS) {
    console.log(`\n=== ${set} ===`);
    all[set] = await convertDir(set);
  }
  console.log("\n--- seed ---");
  for (const set of SETS) {
    console.log(set, all[set].length, "images");
    for (const it of all[set]) console.log(`  ${it.id}  ${it.src}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
