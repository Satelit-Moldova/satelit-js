// The generated types come from spec/openapi.json; this checks that real answers (test/fixtures/samples.json,
// recorded live on 19 Nov 2026, lists trimmed to 3 items) match those schemas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validate, routeOf } from './validate.mjs';

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const spec = read('../spec/openapi.json');
Object.assign(spec.components.schemas, read('../spec/overrides.json').schemas);
const samples = read('./fixtures/samples.json');

for (const [route, s] of Object.entries(samples)) {
  test(`sample ${route} matches the schema`, () => {
    const path = routeOf(spec, route);
    assert.ok(path, `no route for ${route}`);
    const schema = spec.paths[path].get.responses['200'].content['application/json'].schema;
    assert.deepEqual(validate(schema, s.body, spec), []);
  });
}
