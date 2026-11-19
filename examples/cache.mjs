// A tiny file cache for the examples: every Satelit call costs credits, so keep answers for a while.
// Answers live in examples/.cache/ (git-ignored). Delete the folder to force fresh calls.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./.cache/', import.meta.url));

/** Returns the cached answer for `key` if younger than `ttlSeconds`, else calls `load()` and stores it. */
export async function cached(key, ttlSeconds, load) {
  const file = join(dir, createHash('sha256').update(key).digest('hex').slice(0, 16) + '.json');
  try {
    const hit = JSON.parse(await readFile(file, 'utf8'));
    if (Date.now() - hit.at < ttlSeconds * 1000) return { ...hit.value, cached: true };
  } catch {
    // no copy yet
  }
  const value = await load();
  await mkdir(dir, { recursive: true });
  // Keep data and meta (the attribution lives there); the rate info belongs to one call.
  await writeFile(file, JSON.stringify({ at: Date.now(), value: { data: value.data, meta: value.meta } }));
  return { ...value, cached: false };
}

/** The line every screen that shows the data must carry: the answer's attribution, its sources, and Satelit. */
export function attributionLine(meta) {
  const parts = [];
  if (meta.attribution) parts.push(meta.attribution);
  const names = (meta.sources ?? []).map((s) => s.name).filter((n) => n && n !== 'Satelit');
  if (names.length && !parts.length) parts.push(`Source: ${names.join(', ')}`);
  if (!parts.some((p) => p.includes('satelit.md'))) parts.push('Data: Satelit (satelit.md)');
  return parts.join(' | ');
}
