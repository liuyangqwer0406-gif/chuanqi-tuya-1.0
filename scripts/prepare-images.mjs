import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('public/portfolio-assets');
const output = path.resolve('public/portfolio-optimized');
const widths = [640, 1280, 1920];
const report = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const input = path.join(directory, entry.name);
    if (entry.isDirectory()) { await visit(input); continue; }
    if (!/\.(png|jpe?g|webp)$/i.test(entry.name)) continue;
    const relative = path.relative(root, input);
    const original = await stat(input);
    const sizes = {};
    await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
    for (const width of widths) {
      const destination = path.join(output, `${relative}-${width}.webp`);
      const cached = await stat(destination).catch(() => null);
      if (!cached || cached.mtimeMs < original.mtimeMs) {
        await sharp(input).rotate().resize({ width, withoutEnlargement: true })
          .webp({ quality: 84, effort: 4 }).toFile(destination);
      }
      sizes[width] = (await stat(destination)).size;
    }
    report.push({ image: relative.replaceAll('\\', '/'), original: original.size, sizes });
  }
}

await visit(root);
await mkdir('output/qa', { recursive: true });
await writeFile('output/qa/image-sizes.json', JSON.stringify(report, null, 2));
const sum = (key) => report.reduce((total, item) => total + (key ? item.sizes[key] : item.original), 0);
console.log(`Images: ${report.length}; original ${(sum() / 1e6).toFixed(2)} MB; 1280px ${(sum(1280) / 1e6).toFixed(2)} MB (${(100 - sum(1280) / sum() * 100).toFixed(1)}% smaller).`);
