import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Satelit } from '../dist/esm/index.js';
import { mockFetch, meta } from './mock.mjs';

const table = JSON.parse(readFileSync(new URL('../spec/method-table.json', import.meta.url), 'utf8'));
const spec = JSON.parse(readFileSync(new URL('../spec/openapi.json', import.meta.url), 'utf8'));

test('every GET route of the OpenAPI has a method (export by hand)', () => {
  const covered = new Set(table.map(([, path]) => path));
  const missing = Object.keys(spec.paths).filter((p) => !covered.has(p) && p !== '/export/{product}' && p !== '/movies/img/{size}/{file}');
  assert.deepEqual(missing, []);
});

test('each method calls its own route', async () => {
  const f = mockFetch([{ body: { data: [], meta: meta() } }]);
  const c = new Satelit({ apiKey: 'sat_live_x', fetch: f });
  for (const [name, path] of table) {
    const fn = name.split('.').reduce((o, k) => o[k], c);
    assert.equal(typeof fn, 'function', name);
    const holes = [...path.matchAll(/\{(\w+)\}/g)].map((m, i) => `v${i}`);
    await fn(...holes, {});
    const want = '/v1' + path.replace(/\{\w+\}/g, () => holes.shift());
    assert.equal(f.calls.at(-1).url.pathname, want, name);
  }
  assert.equal(f.calls.length, table.length);
});

test('methods stay bound when passed around', async () => {
  const f = mockFetch([{ body: { data: [], meta: meta() } }]);
  const { list } = new Satelit({ apiKey: 'sat_live_x', fetch: f }).tours;
  await list({ country: 'Grecia' });
  assert.equal(f.calls[0].url.searchParams.get('country'), 'Grecia');
});
