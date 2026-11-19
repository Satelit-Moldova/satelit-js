// Live smoke test against https://api.satelit.md/v1. Runs only with SATELIT_API_KEY set:
//   SATELIT_API_KEY=sat_live_… npm run test:live
// Spends about 60 credits (one Movies call is 40). Prints what it saw, never the key.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Satelit, SatelitError } from '../dist/esm/index.js';

const KEY = process.env.SATELIT_API_KEY;
const skip = KEY ? false : 'SATELIT_API_KEY is not set';
const s = new Satelit({ apiKey: KEY, lang: 'en' });
const keyless = new Satelit({ apiKey: '' });
let spent = 0;
const seen = (label, r) => {
  spent += r.rate.creditsCost ?? 0;
  console.log(`  ${label}: credits ${r.rate.creditsCost}, remaining ${r.rate.creditsRemaining}, rate ${r.rate.remaining}/${r.rate.limit}`);
};

test('keyless routes answer the SDK user agent (no Cloudflare block)', { skip }, async () => {
  const sample = await keyless.sample();
  assert.ok(sample.data.rates.length > 0);
  assert.equal(sample.rate.creditsCost, 0);
  const status = await keyless.status();
  assert.equal(status.data.ok, true);
  const plans = await keyless.plans();
  assert.ok(plans.data.plans.length > 0);
  const board = await keyless.movies.board({ lang: 'en' });
  assert.ok(Array.isArray(board.data.cinemas));
  console.log(`  sample, status, plans, movies.board: 200, ${board.data.cinemas.length} cinemas on ${board.data.day}`);
});

test('me: plan and credits', { skip }, async () => {
  const r = await s.me();
  assert.equal(typeof r.data.plan, 'string');
  assert.equal(r.rate.creditsCost, 0);
  console.log(`  plan ${r.data.plan}, used ${r.data.credits.used} of ${r.data.credits.limit}`);
});

test('rates: EUR today with the BNM attribution', { skip }, async () => {
  const r = await s.rates.list();
  const eur = r.data.find((x) => x.code === 'EUR');
  assert.ok(eur && eur.value > 10 && eur.value < 40, 'EUR looks like a leu rate');
  assert.match(r.meta.attribution ?? '', /bnm\.md/);
  assert.equal(s.lastRate.creditsCost, 1);
  assert.deepEqual(s.lastMeta, r.meta);
  seen(`rates.list EUR ${eur.value} on ${eur.date}`, r);
  const h = await s.rates.history({ code: 'EUR', days: 30 });
  assert.equal(h.data.code, 'EUR');
  assert.ok(h.data.points.length > 5);
  seen(`rates.history ${h.data.points.length} points`, h);
});

test('fuel today', { skip }, async () => {
  const r = await s.fuel.today();
  assert.ok(r.data.networks.length > 3);
  seen(`fuel.today ${r.data.date}: A95 from ${r.data.range.a95.min} (${r.data.cheapest.a95})`, r);
});

test('prices search and paginate (2 pages)', { skip }, async () => {
  const r = await s.prices.search({ q: 'lapte' });
  assert.ok(r.data.length > 0);
  assert.ok(r.meta.page && r.meta.page.pages >= 1);
  seen(`prices.search lapte: ${r.meta.page.total} products, first ${r.data[0].name} from ${r.data[0].min_price}`, r);
  let n = 0;
  for await (const item of s.paginate(s.prices.search, { q: 'lapte' }, { maxPages: 2 })) {
    assert.equal(typeof item.id, 'number');
    n++;
  }
  assert.ok(n > r.data.length, 'two pages hold more than one');
  console.log(`  paginate prices.search: ${n} items over 2 pages`);
  spent += 6;
});

test('news, power, jokes, companies', { skip }, async () => {
  const news = await s.news.list({ per: 3 });
  assert.equal(news.data.length, 3);
  seen(`news.list: ${news.meta.page.total} stories`, news);
  const power = await s.power.day();
  assert.ok(power.data.hours.length > 0);
  seen(`power.day ${power.data.date}: base ${power.data.base} ${power.data.currency}/${power.data.unit}`, power);
  const joke = await s.jokes.today({ lang: 'ro' });
  assert.equal(typeof joke.data.text, 'string');
  seen('jokes.today', joke);
  const co = await s.companies.search({ q: 'moldtelecom' });
  assert.ok(co.data.length > 0);
  seen(`companies.search moldtelecom: ${co.data[0].name}`, co);
});

test('movies: one search (40 credits) and genres (0)', { skip }, async () => {
  const g = await s.movies.genres();
  assert.ok(g.data.genres.length > 5);
  assert.equal(g.rate.creditsCost, 0);
  const r = await s.movies.search({ q: 'matrix', kind: 'movie' });
  assert.ok(r.data.results.length > 0);
  assert.equal(r.rate.creditsCost, 40);
  const first = r.data.results[0];
  seen(`movies.search matrix: ${r.data.total} results, first ${first.kind === 'person' ? first.name : first.title}`, r);
});

test('errors: invalid, plan_required (feed, export), key_invalid', { skip }, async () => {
  const inv = await s.rates.history({ code: '' }).catch((e) => e);
  assert.ok(inv instanceof SatelitError);
  assert.equal(inv.status, 422);
  assert.equal(inv.code, 'invalid');
  assert.deepEqual(inv.fields, ['code']);
  console.log(`  422 ${inv.code} fields=${inv.fields} docs=${inv.docs}`);

  const me = await s.me();
  const feedAllowed = ['business', 'companies'].includes(me.data.plan);
  if (!feedAllowed) {
    const feed = await s.feed.list().catch((e) => e);
    assert.equal(feed.status, 402);
    assert.equal(feed.code, 'plan_required');
    const exp = await (async () => {
      for await (const row of s.export.rows('rates')) return row;
    })().catch((e) => e);
    assert.equal(exp.code, 'plan_required');
    console.log(`  feed and export on ${me.data.plan}: 402 plan_required`);
  }

  const bad = await new Satelit({ apiKey: 'sat_live_not_a_real_key_000000', maxRetries: 0 }).rates.list().catch((e) => e);
  assert.equal(bad.status, 401);
  assert.equal(bad.code, 'key_invalid');
  console.log(`  bad key: 401 ${bad.code}`);
  console.log(`  credits spent by this run, from X-Credits-Cost: about ${spent}`);
});
