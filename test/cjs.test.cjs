const { test } = require('node:test');
const assert = require('node:assert/strict');
const sdk = require('../dist/cjs/index.js');

test('the CommonJS build loads and works', async () => {
  assert.equal(typeof sdk.Satelit, 'function');
  assert.equal(sdk.VERSION, '1.0.0');
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    return new Response(JSON.stringify({ data: { ok: true }, meta: { credits: 0, sources: [], attribution: null, updated_at: null } }));
  };
  const r = await new sdk.Satelit({ apiKey: '', fetch }).status();
  assert.deepEqual(r.data, { ok: true });
  assert.equal(calls[0], 'https://api.satelit.md/v1/status');
  assert.ok(new sdk.SatelitError({ status: 1, code: 'x', message: 'm' }) instanceof Error);
});
