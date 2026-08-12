/**
 * Convert public/book/*.jpg → page-XX.webp + manifest.json
 *
 *   node scripts/normalize-book.mjs --dry
 *   node scripts/normalize-book.mjs
 */
import { readdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry");
const DIR = path.resolve("public/book");
const QUALITY = 85;
const MAX_EDGE = 2000;

const kb = (n) => `${Math.round(n / 1024)}KB`;

function pageNum(name) {
  const m = name.match(/^(\d+)\.(jpe?g|png|webp)$/i);
  return m ? Number(m[1]) : NaN;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

async function run() {
  let entries;
  try {
    entries = await readdir(DIR);
  } catch {
    console.error("missing public/book");
    process.exit(1);
  }

  const sources = entries
    .filter((n) => /\.(jpe?g|png)$/i.test(n))
    .sort((a, b) => pageNum(a) - pageNum(b));

  if (!sources.length) {
    console.log("no source images to convert");
    return;
  }

  const items = [];
  let before = 0;
  let after = 0;
  let seq = 0;

  for (const name of sources) {
    seq += 1;
    const slug = `page-${pad(seq)}`;
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
      `${DRY ? "would" : "wrote"}  book/${slug}.webp  (${name})  ${kb(buf.length)} -> ${kb(out.length)}  (-${pct}%)`,
    );

    if (!DRY) {
      await writeFile(target, out);
      await unlink(file);
    }

    items.push({
      id: slug,
      src: `/book/${slug}.webp`,
      label: `Spread ${seq}`,
      source: name,
    });
  }

  if (before) {
    console.log(
      `\nbook total: ${kb(before)} -> ${kb(after)}  (-${Math.round(100 - (after / before) * 100)}%)`,
    );
  }

  const manifest = {
    id: "book",
    title: "Quiet Hours — Issue 02",
    subtitle: "Editorial spreads",
    generatedAt: new Date().toISOString(),
    items,
  };

  if (!DRY) {
    await writeFile(
      path.join(DIR, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
  }

  console.log(`\n${items.length} spreads`);
  for (const it of items) console.log(`  ${it.id}  ${it.src}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
