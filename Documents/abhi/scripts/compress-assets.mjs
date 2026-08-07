/**
 * Re-encode oversized public assets.
 *
 *   node scripts/compress-assets.mjs --dry    # report only
 *   node scripts/compress-assets.mjs          # write
 *
 * Two strategies, chosen per asset:
 *
 *  - WebP for anything carrying alpha or heavy gradients (the
 *    Photoshop layer stack blends with `screen`, so transparency is
 *    load-bearing and banding would be obvious). Palette PNG was
 *    measurably worse here: it quantises to 256 colours and was also
 *    *larger* than WebP on most of the stack.
 *  - mozjpeg for opaque photographs, keeping the .jpg extension so no
 *    source reference has to change.
 *
 * WebP conversions change the file extension, so the few `src` strings
 * that point at them are updated alongside this script.
 */
import { readdir, stat, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DRY = process.argv.includes("--dry");
const ROOT = path.resolve("public");

const JOBS = [
  { dir: "photoshop", to: "webp", maxEdge: 1600, quality: 82 },
  { dir: "creators", to: "jpeg", maxEdge: 800, quality: 78 },
  { dir: "work", to: "jpeg", maxEdge: 1600, quality: 80 },
  { dir: ".", to: "webp", maxEdge: 1200, quality: 82, only: ["profile.png"] },
];

const kb = (n) => `${Math.round(n / 1024)}KB`;

async function run() {
  let before = 0;
  let after = 0;
  const notes = [];

  for (const job of JOBS) {
    const dir = path.join(ROOT, job.dir);
    let entries;
    try {
      entries = await readdir(dir);
    } catch {
      continue;
    }

    for (const name of entries) {
      if (job.only && !job.only.includes(name)) continue;
      if (!/\.(png|jpe?g)$/i.test(name)) continue;

      const file = path.join(dir, name);
      if (!(await stat(file)).isFile()) continue;

      const buf = await readFile(file);
      const meta = await sharp(buf).metadata();

      let pipe = sharp(buf, { failOn: "none" });
      if (meta.width && meta.width > job.maxEdge) {
        pipe = pipe.resize({ width: job.maxEdge, withoutEnlargement: true });
      }

      pipe =
        job.to === "webp"
          ? pipe.webp({ quality: job.quality, alphaQuality: 90, effort: 5 })
          : pipe.jpeg({ quality: job.quality, mozjpeg: true, progressive: true });

      const out = await pipe.toBuffer();

      // Never write something bigger than what's already there.
      if (out.length >= buf.length * 0.95) {
        notes.push(`${job.dir}/${name} — already lean (${kb(buf.length)})`);
        before += buf.length;
        after += buf.length;
        continue;
      }

      const target =
        job.to === "webp"
          ? path.join(dir, name.replace(/\.(png|jpe?g)$/i, ".webp"))
          : file;

      before += buf.length;
      after += out.length;
      const pct = Math.round(100 - (out.length / buf.length) * 100);
      console.log(
        `${DRY ? "would" : "wrote"}  ${job.dir}/${path.basename(target)}  ` +
          `${kb(buf.length)} -> ${kb(out.length)}  (-${pct}%)`,
      );

      if (!DRY) {
        await writeFile(target, out);
        if (target !== file) await unlink(file);
      }
    }
  }

  if (notes.length) {
    console.log("\nleft alone:");
    for (const n of notes) console.log("  " + n);
  }
  console.log(
    `\ntotal: ${kb(before)} -> ${kb(after)}  ` +
      `(-${Math.round(100 - (after / before) * 100)}%)`,
  );
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
