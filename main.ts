// make.fun news-image-20261120 entry.
// A newspaper front page summing up the world's news of Friday 20 November
// 2026: the Kyiv bridge attacks and missiles landing in Poland, the ICJ
// genocide ruling on Myanmar, the AI stock rout, the Shenzhen summit, and
// more. The artwork is entry.png next to this file; this program checks it
// meets the competition limits and copies it to the output directory.
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const LIMIT_BYTES = 1024 * 1024;
const LIMIT_PX = 1024;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

const here = new URL('./entry.png', import.meta.url);
if (!existsSync(here)) die('entry.png is missing next to main.ts');
const bytes = readFileSync(here);

if (bytes.length > LIMIT_BYTES) {
  die(`entry.png is ${bytes.length} bytes, above the 1 MiB limit`);
}
for (let i = 0; i < PNG_MAGIC.length; i++) {
  if (bytes[i] !== PNG_MAGIC[i]) die('entry.png is not a PNG file');
}
if (bytes.length < 24 || bytes.toString('latin1', 12, 16) !== 'IHDR') {
  die('entry.png has no IHDR chunk');
}
const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
const w = view.getUint32(16);
const h = view.getUint32(20);
if (w > LIMIT_PX || h > LIMIT_PX) {
  die(`entry.png is ${w}x${h}, above the 1024x1024 limit`);
}
// A whole PNG ends with the IEND chunk: zero-length, "IEND", then its CRC.
const tail = bytes.subarray(bytes.length - 12);
if (tail.readUInt32BE(0) !== 0 || tail.toString('latin1', 4, 8) !== 'IEND') {
  die('entry.png has no IEND trailer, the file looks truncated');
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const dest = join(outDir, 'entry.png');
copyFileSync(here, dest);
if (!readFileSync(dest).equals(bytes)) {
  die('copied entry.png does not match the source');
}
console.log(`wrote ${dest} (${bytes.length} bytes, ${w}x${h})`);
