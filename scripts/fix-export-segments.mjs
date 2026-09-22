import { copyFile, readdir } from 'node:fs/promises';
import path from 'node:path';

// Next 16.3.2 uses path.relative() but only replaces '/' in segment filenames.
// Windows therefore exports nested __next.* folders instead of flat RSC files.
// Add the expected filenames without modifying Next or deleting its output.
let copied = 0;
async function flatten(directory, destination, prefix) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const input = path.join(directory, entry.name);
    const name = `${prefix}.${entry.name}`;
    if (entry.isDirectory()) await flatten(input, destination, name);
    else if (entry.name.endsWith('.txt')) {
      await copyFile(input, path.join(destination, name));
      copied++;
    }
  }
}
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const input = path.join(directory, entry.name);
    if (entry.name.startsWith('__next.')) await flatten(input, directory, entry.name);
    else await visit(input);
  }
}
await visit(path.resolve('out'));
console.log(`Static export: restored ${copied} Windows segment filenames (Linux exports need no changes).`);
