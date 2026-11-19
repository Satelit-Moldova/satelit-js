import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { Satelit, SatelitError, VERSION } from '../dist/esm/index.js';
import { mockFetch, meta, RATE_HEADERS, apiError, hangingFetch, chunked } from './mock.mjs';

const KEY = 'sat_live_test_0000';
const client = (fetch, opts = {}) => new Satelit({ apiKey: KEY, fetch, ...opts });

test('sends the key, the user agent and the language; builds the query', async () => {
  const f = mockFetch([{ body: { data: [], meta: meta() } }]);
  await client(f, { lang: 'en' }).news.list({ region: 'chisinau', per: 5, page: undefined, from: '2026-11-01' });
  const { url, headers } = f.calls[0];
  assert.equal(url.origin + url.pathname, 'https://api.satelit.md/v1/news');
  assert.equal(url.searchParams.get('region'), 'chisinau');
  assert.equal(url.searchParams.get('per'), '5');
  assert.equal(url.searchParams.get('from'), '2026-11-01');
  assert.equal(url.searchParams.has('page'), false);
  assert.equal(url.searchParams.get('lang'), 'en');
  assert.equal(headers.Authorization, `Bearer ${KEY}`);
  assert.equal(headers['User-Agent'], `satelit-js/${VERSION}`);
  assert.equal(headers.Accept, 'application/json');
});

test('per-call lang wins; arrays join with commas; booleans are words; path segments are encoded', async () => {
  const f = mockFetch([{ body: { data: [], meta: meta() } }]);
  const c = client(f, { lang: 'ro' });
  await c.jokes.random({ exclude_flags: ['dark', 'adult'], seen: 'a,b' }, { lang: 'ru' });
  await c.prices.search({ q: 'lapte 2.5%', in_stock: true });
  await c.recipes.get('plăcintă/x');
  assert.equal(f.calls[0].url.searchParams.get('exclude_flags'), 'dark,adult');
  assert.equal(f.calls[0].url.searchParams.get('lang'), 'ru');
  assert.equal(f.calls[1].url.searchParams.get('q'), 'lapte 2.5%');
  assert.equal(f.calls[1].url.searchParams.get('in_stock'), 'true');
  assert.equal(f.calls[2].url.pathname, '/v1/recipes/pl%C4%83cint%C4%83%2Fx');
});

test('resolves {data, meta, rate} and remembers lastMeta and lastRate', async () => {
  const m = meta({ attribution: 'Sursa: BNM', page: { page: 1, per: 20, total: 1, pages: 1 } });
  const f = mockFetch([{ body: { data: [{ code: 'EUR', value: 19.5 }], meta: m }, headers: RATE_HEADERS }]);
  const c = client(f);
  const r = await c.rates.list();
  assert.deepEqual(r.data, [{ code: 'EUR', value: 19.5 }]);
  assert.equal(r.meta.attribution, 'Sursa: BNM');
  assert.deepEqual(r.rate, {
    limit: 600, remaining: 599, reset: 42, creditsCost: 1, creditsLimit: 300000, creditsRemaining: 299000,
    creditsReset: '2026-12-19T16:41:51+02:00', retryAfter: null,
  });
  assert.deepEqual(c.lastMeta, m);
  assert.equal(c.lastRate.creditsRemaining, 299000);
});

test('without a key it sends no Authorization; SATELIT_API_KEY is the default key', async () => {
  const f = mockFetch([{ body: { data: {}, meta: meta() } }]);
  const old = process.env.SATELIT_API_KEY;
  delete process.env.SATELIT_API_KEY;
  await new Satelit({ fetch: f }).sample();
  assert.equal(f.calls[0].headers.Authorization, undefined);
  process.env.SATELIT_API_KEY = 'sat_live_from_env';
  const c = new Satelit({ fetch: f });
  assert.equal(c.hasKey, true);
  await c.status();
  assert.equal(f.calls[1].headers.Authorization, 'Bearer sat_live_from_env');
  if (old === undefined) delete process.env.SATELIT_API_KEY;
  else process.env.SATELIT_API_KEY = old;
});

test('the key never shows when the client is logged or inspected', () => {
  const c = client(mockFetch([{}]));
  assert.equal(inspect(c, { depth: 6, showHidden: true }).includes(KEY), false);
  assert.equal(Object.values(c).some((v) => v === KEY), false);
});

test('422 invalid carries fields, docs and the rate headers', async () => {
  const f = mockFetch([apiError(422, 'invalid', { fields: ['code'] }, RATE_HEADERS)]);
  const err = await client(f).rates.history({ code: '' }).catch((e) => e);
  assert.ok(err instanceof SatelitError);
  assert.equal(err.status, 422);
  assert.equal(err.code, 'invalid');
  assert.deepEqual(err.fields, ['code']);
  assert.equal(err.docs, 'https://developer.satelit.md/en/errors/#invalid');
  assert.equal(err.message, 'msg invalid');
  assert.equal(err.rate.creditsLimit, 300000);
  assert.equal(f.calls.length, 1);
});

test('402 plan_required carries choose', async () => {
  const f = mockFetch([apiError(402, 'plan_required', { choose: 'https://developer.satelit.md/en/pricing/' })]);
  const err = await client(f).feed.list().catch((e) => e);
  assert.equal(err.code, 'plan_required');
  assert.equal(err.choose, 'https://developer.satelit.md/en/pricing/');
});

test('an error without a JSON body still becomes a SatelitError', async () => {
  const f = mockFetch([{ status: 502, body: '<html>Bad gateway</html>' }]);
  const err = await client(f).rates.list().catch((e) => e);
  assert.equal(err.status, 502);
  assert.equal(err.code, 'http_502');
});

test('a 200 that is not JSON is bad_response', async () => {
  const f = mockFetch([{ status: 200, body: 'not json' }]);
  const err = await client(f).rates.list().catch((e) => e);
  assert.equal(err.code, 'bad_response');
});

test('retries 429 rate_limited after Retry-After, then succeeds', async () => {
  const f = mockFetch([
    apiError(429, 'rate_limited', {}, { 'retry-after': '0' }),
    { body: { data: [1], meta: meta() } },
  ]);
  const r = await client(f).rates.list();
  assert.deepEqual(r.data, [1]);
  assert.equal(f.calls.length, 2);
});

test('retries 503 with Retry-After; gives up after maxRetries', async () => {
  const f = mockFetch([apiError(503, 'busy', {}, { 'retry-after': '0' })]);
  const err = await client(f, { maxRetries: 2 }).rates.list().catch((e) => e);
  assert.equal(err.code, 'busy');
  assert.equal(err.retryAfter, 0);
  assert.equal(f.calls.length, 3);
});

test('maxRetries is capped at 3', async () => {
  const f = mockFetch([apiError(503, 'busy', {}, { 'retry-after': '0' })]);
  await client(f, { maxRetries: 10 }).rates.list().catch(() => {});
  assert.equal(f.calls.length, 4);
});

test('never retries quota_exceeded, export_running, 503 without Retry-After, or a long Retry-After', async () => {
  for (const a of [
    apiError(429, 'quota_exceeded', {}, { 'retry-after': '0' }),
    apiError(429, 'export_running', {}, { 'retry-after': '0' }),
    apiError(503, 'busy'),
    apiError(429, 'rate_limited', {}, { 'retry-after': '3600' }),
    apiError(401, 'key_invalid'),
    apiError(500, 'server_error'),
  ]) {
    const f = mockFetch([a]);
    const err = await client(f).rates.list().catch((e) => e);
    assert.equal(err.code, a.body.error.code);
    assert.equal(f.calls.length, 1, a.body.error.code);
  }
});

test('maxRetries: 0 turns retries off', async () => {
  const f = mockFetch([apiError(429, 'rate_limited', {}, { 'retry-after': '0' })]);
  await client(f, { maxRetries: 0 }).rates.list().catch(() => {});
  assert.equal(f.calls.length, 1);
});

test('a slow answer is a timeout error', async () => {
  const err = await client(hangingFetch(), { timeoutMs: 30 }).rates.list().catch((e) => e);
  assert.ok(err instanceof SatelitError);
  assert.equal(err.code, 'timeout');
  assert.equal(err.status, 0);
});

test('a network failure is network_error with the cause', async () => {
  const boom = new TypeError('fetch failed');
  const err = await client(async () => { throw boom; }).rates.list().catch((e) => e);
  assert.equal(err.code, 'network_error');
  assert.equal(err.cause, boom);
});

test("the caller's abort is rethrown as is, not wrapped", async () => {
  const ctrl = new AbortController();
  const p = client(hangingFetch()).rates.list({ signal: ctrl.signal });
  ctrl.abort(new Error('stop'));
  const err = await p.catch((e) => e);
  assert.equal(err.message, 'stop');
});

test('paginate walks meta.page and stops at pages or maxPages', async () => {
  const page = (n) => ({ body: { data: [`a${n}`, `b${n}`], meta: meta({ page: { page: n, per: 2, total: 6, pages: 3 } }) } });
  const f = mockFetch([page(1), page(2), page(3)]);
  const c = client(f);
  const items = [];
  for await (const t of c.paginate(c.tours.list, { country: 'Turcia' })) items.push(t);
  assert.deepEqual(items, ['a1', 'b1', 'a2', 'b2', 'a3', 'b3']);
  assert.deepEqual(f.calls.map((x) => x.url.searchParams.get('page')), ['1', '2', '3']);
  assert.equal(f.calls[2].url.searchParams.get('country'), 'Turcia');

  const g = mockFetch([page(1), page(2), page(3)]);
  const c2 = client(g);
  const few = [];
  for await (const t of c2.paginate(c2.deals.list, {}, { maxPages: 2 })) few.push(t);
  assert.equal(few.length, 4);
  assert.equal(g.calls.length, 2);
});

test('paginate on a list without meta.page makes one call', async () => {
  const f = mockFetch([{ body: { data: [1, 2], meta: meta() } }]);
  const c = client(f);
  const items = [];
  for await (const x of c.paginate(c.prices.search, { q: 'lapte' })) items.push(x);
  assert.deepEqual(items, [1, 2]);
  assert.equal(f.calls.length, 1);
});

test('feed.iterate follows meta.next until has_more is false', async () => {
  const f = mockFetch([
    { body: { data: [{ id: '1' }, { id: '2' }], meta: meta({ next: 'c2', has_more: true }) } },
    { body: { data: [{ id: '3' }], meta: meta({ next: 'c3', has_more: false }) } },
  ]);
  const cursors = [];
  const ids = [];
  const it = client(f).feed.iterate({ types: ['news.published', 'rates.updated'], limit: 2 }, { onCursor: (c) => cursors.push(c) });
  for await (const ev of it) ids.push(ev.id);
  assert.deepEqual(ids, ['1', '2', '3']);
  assert.deepEqual(cursors, ['c2', 'c3']);
  assert.equal(f.calls[0].url.searchParams.has('after'), false);
  assert.equal(f.calls[0].url.searchParams.get('types'), 'news.published,rates.updated');
  assert.equal(f.calls[1].url.searchParams.get('after'), 'c2');
});

test('export.rows parses NDJSON across chunk edges and checks _end', async () => {
  const bytes = new TextEncoder().encode('{"_meta":{"product":"rates"}}\n{"code":"EUR","name":"Euro ă"}\n{"code":"USD"}\n{"_end":{"rows":2,"complete":true}}\n');
  const cut = bytes.indexOf(0xc4) + 1; // split inside the two bytes of "ă"
  const f = mockFetch([() => chunked([bytes.slice(0, 10), bytes.slice(10, cut), bytes.slice(cut)])]);
  let m;
  let end;
  const rows = [];
  for await (const r of client(f).export.rows('rates', { onMeta: (x) => (m = x), onEnd: (x) => (end = x) })) rows.push(r);
  assert.deepEqual(m, { product: 'rates' });
  assert.deepEqual(rows, [{ code: 'EUR', name: 'Euro ă' }, { code: 'USD' }]);
  assert.deepEqual(end, { rows: 2, complete: true });
  assert.equal(f.calls[0].url.pathname, '/v1/export/rates');
  assert.equal(f.calls[0].headers.Accept, 'application/x-ndjson');
});

test('export.rows throws export_incomplete when _end is missing', async () => {
  const f = mockFetch([() => chunked(['{"_meta":{}}\n{"a":1}\n'])]);
  const rows = [];
  const err = await (async () => {
    for await (const r of client(f).export.rows('fuel')) rows.push(r);
  })().catch((e) => e);
  assert.equal(rows.length, 1);
  assert.equal(err.code, 'export_incomplete');
});

test('export errors come before any row (402 on plans without export)', async () => {
  const f = mockFetch([apiError(402, 'plan_required')]);
  const err = await client(f).export.stream('rates').catch((e) => e);
  assert.equal(err.code, 'plan_required');
});

test('client.get reaches any route', async () => {
  const f = mockFetch([{ body: { data: { ok: true }, meta: meta() } }]);
  const r = await client(f).get('/some/new/route', { a: 1 });
  assert.deepEqual(r.data, { ok: true });
  assert.equal(f.calls[0].url.pathname, '/v1/some/new/route');
});

test('baseUrl trailing slashes are trimmed', async () => {
  const f = mockFetch([{ body: { data: 1, meta: meta() } }]);
  await client(f, { baseUrl: 'http://localhost:8080/v1/' }).me();
  assert.equal(f.calls[0].url.href, 'http://localhost:8080/v1/me');
});

test('a key in a browser page is refused unless allowBrowser', async () => {
  globalThis.document = {};
  try {
    const mod = await import(`../dist/esm/core.js?browser=${Date.now()}`);
    assert.throws(() => new mod.SatelitCore({ apiKey: KEY, fetch: mockFetch([{}]) }), /visible to every visitor/);
    assert.doesNotThrow(() => new mod.SatelitCore({ apiKey: KEY, fetch: mockFetch([{}]), allowBrowser: true }));
    assert.doesNotThrow(() => new mod.SatelitCore({ apiKey: '', fetch: mockFetch([{}]) }));
  } finally {
    delete globalThis.document;
  }
});
