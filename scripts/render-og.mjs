/**
 * render-og.mjs — assets-src/og.svg(자작)을 public/og.png(1200×630)로 래스터화.
 * 실행: node scripts/render-og.mjs  (sharp 필요)
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const svg = readFileSync(resolve(root, 'assets-src/og.svg'));

await sharp(svg, { density: 144 })
  .resize(1200, 630)
  .png()
  .toFile(resolve(root, 'public/og.png'));

console.log('✓ public/og.png (1200×630) 생성');
