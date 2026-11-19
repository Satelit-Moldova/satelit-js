# Satelit SDK for JavaScript and TypeScript

The official client for the [Satelit data API](https://developer.satelit.md/en/docs/): Moldova's official exchange rates, fuel prices, household tariffs, shop prices and deals, laws, news, companies, courts, tours, flights, cinemas and more, through one key.

```
$ node examples/fuel-cheapest.mjs
Fuel prices on 2026-11-19, MDL per litre

Petrol A95  27.90 at TLX, Interacces oil  (dearest 28.80, 20 networks, ANRE cap 28.08)
Diesel      33.25 at TLX  (dearest 34.14, 20 networks, ANRE cap 33.46)
LPG         18.60 at TLX, Nigrup-G  (dearest 19.20, 17 networks)

Source: ANRE | Data: Satelit (satelit.md)
```

- Zero runtime dependencies: it uses the standard `fetch`, `AbortController`, `ReadableStream` and `TextDecoder`.
- ES modules and CommonJS builds, with full `.d.ts` types for every route, generated from the API's OpenAPI document.
- `{ data, meta, rate }` from every call: the data, its sources and attribution, and the credits and rate limit left.
- One error type, `SatelitError`, with the API's `code`, `message`, `docs` link, `fields` and `retryAfter`.
- Timeouts on every call, bounded retries only where the API says to wait, page and feed iterators, and a streaming NDJSON export reader.

## Quick start

```js
import { Satelit } from '@satelit-moldova/sdk';

const satelit = new Satelit({ apiKey: process.env.SATELIT_API_KEY });
const { data, meta } = await satelit.rates.list();
console.log(data.find((r) => r.code === 'EUR').value, meta.attribution);
```

## Requirements

- Node.js 18 or newer, or any runtime with a standard global `fetch` (pass your own with the `fetch` option otherwise).
- A Satelit API key (`sat_live_…`) from the [console](https://developer.satelit.md/en/console/). The API is paid: see [pricing](https://developer.satelit.md/en/pricing/). To look before you buy, the keyless routes (`sample`, `products`, `plans`, `status`, `stats`, `movies.board`) work without a key.

## Install

Straight from GitHub (the built `dist/` is committed, so no build step runs on install):

```sh
npm install github:Satelit-Moldova/satelit-js
```

The package name is `@satelit-moldova/sdk`:

```js
import { Satelit, SatelitError } from '@satelit-moldova/sdk';      // ES modules
const { Satelit, SatelitError } = require('@satelit-moldova/sdk'); // CommonJS
```

## Configure

```js
const satelit = new Satelit({
  apiKey: process.env.SATELIT_API_KEY, // the default when omitted, where `process` exists
  lang: 'en',          // ro (default), ru, en, uk; per call too: { lang: 'ru' }
  timeoutMs: 10_000,   // per attempt, headers and body (default 10 s)
  maxRetries: 2,       // 429 rate_limited and 503 with Retry-After only; at most 3
  baseUrl: 'https://api.satelit.md/v1',
  fetch: globalThis.fetch,
});
```

**Keep the key on a server.** A key in browser code is readable by every visitor, and every call it makes is billed to you. The client refuses a key when it runs in a web page (unless you pass `allowBrowser: true`); call Satelit from your server or a small proxy and send your page only what it shows. The keyless routes are fine in a browser.

A minimal proxy for one route, with a cache ([`examples/proxy.mjs`](examples/proxy.mjs)):

```js
import { createServer } from 'node:http';
import { Satelit } from '@satelit-moldova/sdk';

const satelit = new Satelit(); // SATELIT_API_KEY from the environment
let copy = null;

createServer(async (req, res) => {
  if (req.url !== '/rates') return res.writeHead(404).end();
  if (!copy || Date.now() - copy.at > 3 * 3600_000) {
    try {
      const { data, meta } = await satelit.rates.list();
      copy = { at: Date.now(), body: JSON.stringify({ data, attribution: meta.attribution }) };
    } catch (e) {
      console.error(`rates: ${e.code ?? e.message}`); // short line; keep serving the old copy
      if (!copy) return res.writeHead(502).end();
    }
  }
  res.writeHead(200, { 'content-type': 'application/json' }).end(copy.body);
}).listen(Number(process.env.PORT) || 8080, '127.0.0.1');
```

## Usage

Every method returns a promise of `{ data, meta, rate }`:

```js
const r = await satelit.prices.search({ q: 'lapte', in_stock: true });
r.data;                  // PriceItem[]
r.meta.page;             // { page: 1, per: 20, total: 100, pages: 5 }
r.meta.sources;          // [{ name, url, license }]
r.meta.attribution;      // a line to show with the data, or null
r.rate.creditsCost;      // 3
r.rate.creditsRemaining; // credits left this period
satelit.lastMeta;        // meta of the last answer
satelit.lastRate;        // rate info of the last answer, also after an error
```

Path parameters come first, query parameters as one object, call options last:

```js
await satelit.rates.history({ code: 'EUR', days: 30 });
await satelit.law.act(12345);
await satelit.news.events.comments('e_123', { sort: 'top', per: 10 }, { lang: 'ru' });
await satelit.movies.today({ city: 'Chișinău' }, { signal: AbortSignal.timeout(5000) });
```

### Pages

Paged lists carry `meta.page`. `paginate` walks them and yields the items; every page is a call and costs its credits, so bound it with `maxPages`:

```js
for await (const tour of satelit.paginate(satelit.tours.list, { country: 'Turcia' }, { maxPages: 3 })) {
  console.log(tour.hotel, tour.price_mdl);
}
```

### Feed (Business and Enterprise)

```js
let cursor = loadCursor(); // keep it between runs
for await (const ev of satelit.feed.iterate({ after: cursor, types: ['rates.updated'] }, { onCursor: (c) => (cursor = c) })) {
  handle(ev);
}
saveCursor(cursor);
```

### Export (Enterprise)

```js
let rows = 0;
for await (const row of satelit.export.rows('fuel', { onEnd: (end) => console.log(end) })) rows++;

// or the raw NDJSON bytes, into a file:
import { Readable } from 'node:stream';
import { createWriteStream } from 'node:fs';
Readable.fromWeb(await satelit.export.stream('rates')).pipe(createWriteStream('rates.ndjson'));
```

`export.rows` throws `export_incomplete` when the stream ends without its `_end` line (the file was cut).

### Any other route

`satelit.get(path, query, opts)` calls any GET route with the same auth, retries and errors, for routes newer than this SDK.

## Methods

Every route of the API (generated from [`spec/openapi.json`](spec/openapi.json) by `npm run generate`). Credits are as the API documents them; the `rate.creditsCost` of each answer is the exact figure.

<!-- methods:start -->
| Method | Route | Credits |
|---|---|---|
| `rates.list()` | `/rates` | Costs 1 credit |
| `rates.history({ code, … })` | `/rates/history` | Costs 1 credit per started 30 days |
| `fuel.today()` | `/fuel` | Costs 1 credit |
| `fuel.stations(params?)` | `/fuel/stations` | Costs 5 credits per page |
| `fuel.history({ fuel, … })` | `/fuel/history` | Costs 2 credits per started 30 days |
| `tariffs.list()` | `/tariffs` | Costs 1 credit |
| `indexes.basket(params?)` | `/indexes/basket` | Costs per day, across shops, with no shop named |
| `indexes.moves(params?)` | `/indexes/moves` | Costs 2 credits |
| `law.acts(params?)` | `/law/acts` | Costs 3 credits with `q`, else 2 |
| `law.act(id)` | `/law/acts/{id}` | Costs 1 credit |
| `law.digests(params?)` | `/law/digests` | Costs 2 credits |
| `law.digest(date)` | `/law/digests/{date}` | Costs 2 credits |
| `news.list(params?)` | `/news` | Costs 2 credits |
| `news.now(params?)` | `/news/now` | Costs 2 credits |
| `news.search({ q, … })` | `/news/search` | Costs 3 credits |
| `news.day(date, params?)` | `/news/days/{date}` | Costs 10 credits |
| `news.categories()` | `/news/categories` | Costs 1 credit |
| `news.regions()` | `/news/regions` | Costs 1 credit |
| `news.outlets()` | `/news/outlets` | Costs 1 credit |
| `news.get(id)` | `/news/{id}` | Costs 1 credit |
| `news.reaction(id)` | `/news/{id}/reaction` | Costs 1 credit |
| `news.comments(id, params?)` | `/news/{id}/comments` | Costs 3 credits |
| `news.events.list(params?)` | `/news/events` | Costs 2 credits |
| `news.events.get(id)` | `/news/events/{id}` | Costs 1 credit |
| `news.events.comments(id, params?)` | `/news/events/{id}/comments` | Costs 3 credits |
| `places.list(params?)` | `/places` | Costs 2 credits per page |
| `recipes.list()` | `/recipes` | Costs at today's prices: one total, no shop behind it |
| `recipes.get(slug)` | `/recipes/{slug}` | Costs 1 credit |
| `prices.stores()` | `/prices/stores` | Costs 1 credit |
| `prices.search({ q, … })` | `/prices/search` | Costs 3 credits |
| `prices.groups(params?)` | `/prices/groups` | Costs 2 credits |
| `prices.group(id)` | `/prices/groups/{id}` | Costs 3 credits |
| `prices.item(id)` | `/prices/items/{id}` | Costs 2 credits |
| `prices.itemHistory(id, params?)` | `/prices/items/{id}/history` | Costs 5 credits per started 30 days |
| `deals.list(params?)` | `/deals` | Costs 5 credits per page |
| `tours.list(params?)` | `/tours` | Costs 3 credits per page |
| `tours.countries()` | `/tours/countries` | Costs 1 credit |
| `tours.get(id)` | `/tours/{id}` | Costs on each day we saw it |
| `flights.destinations()` | `/flights/destinations` | Costs 2 credits |
| `flights.destination(code)` | `/flights/destinations/{code}` | Costs 3 credits |
| `flights.board(params?)` | `/flights/board` | Costs 2 credits |
| `rest.list(params?)` | `/rest` | Costs 3 credits per page |
| `estate.get(params?)` | `/estate` | Costs 3 credits |
| `power.day(params?)` | `/power` | Costs 1 credit |
| `power.history(params?)` | `/power/history` | Costs 2 credits per started 30 days |
| `power.bilateral(params?)` | `/power/bilateral` | Costs 1 credit |
| `market.categories()` | `/market/categories` | Costs 2 credits |
| `market.prices(params?)` | `/market/prices` | Costs 2 credits per 50 rows |
| `market.history(params?)` | `/market/history` | Costs 3 credits per started 30 days |
| `market.sellers(params?)` | `/market/sellers` | Costs 3 credits per 50 rows |
| `market.seller(id)` | `/market/sellers/{id}` | Costs 2 credits |
| `feed.list(params?)` | `/feed` | Business and Enterprise plans only. Costs nothing on a contract plan |
| `jokes.list(params?)` | `/jokes` | Costs 1 credit per 20 rows, 2 with `q` |
| `jokes.today(params?)` | `/jokes/today` | Costs 1 credit |
| `jokes.random(params?)` | `/jokes/random` | Costs 1 credit |
| `jokes.topics(params?)` | `/jokes/topics` | Costs 1 credit |
| `jokes.get(id)` | `/jokes/{id}` | Costs 1 credit |
| `courts.courts()` | `/courts/courts` | Costs 1 credit |
| `courts.search({ q, … })` | `/courts/search` | Costs 3 credits per 20 rows |
| `courts.hearings(params?)` | `/courts/hearings` | Costs 2 credits per 50 rows |
| `courts.case({ number, … })` | `/courts/case` | Costs 1 credit |
| `courts.judge(slug)` | `/courts/judges/{slug}` | Costs 1 credit |
| `courts.name(kind, slug, params?)` | `/courts/names/{kind}/{slug}` | Costs 3 credits per 20 rows |
| `courts.stats(params?)` | `/courts/stats` | Costs 2 credits |
| `citizenship.lookup({ q, … })` | `/citizenship/lookup` | Costs 1 credit |
| `citizenship.stats(params?)` | `/citizenship/stats` | Costs 2 credits |
| `citizenship.years()` | `/citizenship/years` | Costs 1 credit |
| `citizenship.year(slug, params?)` | `/citizenship/years/{slug}` | Costs 2 credits per 200 rows |
| `citizenship.orders(params?)` | `/citizenship/orders` | Costs 2 credits per 50 rows |
| `citizenship.order(order, params?)` | `/citizenship/orders/{order}` | Costs 2 credits per 200 rows |
| `citizenship.oath()` | `/citizenship/oath` | Costs 1 credit |
| `companies.search({ q, … })` | `/companies` | Costs 3 credits per 20 rows |
| `companies.stats()` | `/companies/stats` | Costs 2 credits |
| `companies.licences(params?)` | `/companies/licences` | Costs 2 credits per 50 rows |
| `companies.notices(params?)` | `/companies/notices` | Costs 2 credits per 50 rows |
| `companies.get(idno)` | `/companies/{idno}` | Costs 2 credits |
| `companies.contracts(idno, params?)` | `/companies/{idno}/contracts` | Costs 2 credits per 50 rows |
| `companies.licencesOf(idno)` | `/companies/{idno}/licences` | Costs 1 credit |
| `companies.noticesOf(idno)` | `/companies/{idno}/notices` | Costs 1 credit |
| `delivery.terms(params?)` | `/delivery` | Costs 2 credits |
| `insurance.insurers()` | `/insurance/insurers` | Costs 2 credits |
| `insurance.market()` | `/insurance/market` | Costs 2 credits |
| `insurance.tariffs(params?)` | `/insurance/tariffs` | Costs 1 credit |
| `geo.search({ q, … })` | `/geo/search` | Costs 1 credit |
| `geo.streets({ q, … })` | `/geo/streets` | Costs 2 credits per 50 rows |
| `catalog.tree()` | `/catalog/tree` | Costs 0 credits |
| `movies.search({ q, … })` | `/movies/search` | Costs 40 credits |
| `movies.title(id)` | `/movies/titles/{id}` | Costs 40 credits |
| `movies.titleFull(id)` | `/movies/titles/{id}/full` | Costs 55 credits |
| `movies.showtimes(id, params?)` | `/movies/titles/{id}/showtimes` | Costs 40 credits |
| `movies.person(id)` | `/movies/people/{id}` | Costs 40 credits |
| `movies.discover(params?)` | `/movies/discover` | Costs 40 credits |
| `movies.trending(params?)` | `/movies/trending` | Costs 40 credits |
| `movies.inCinemas(params?)` | `/movies/cinema` | Costs 40 credits |
| `movies.genres(params?)` | `/movies/genres` | Costs nothing |
| `movies.cinemas(params?)` | `/movies/cinemas` | Costs 40 credits |
| `movies.cinemaSchedule(id, params?)` | `/movies/cinemas/{id}/schedule` | Costs 40 credits |
| `movies.today(params?)` | `/movies/cinemas/today` | Costs 40 credits |
| `movies.board()` | `/movies/board` | No key, 0 credits |
| `me()` | `/me` | Costs nothing |
| `products()` | `/products` | No key, 0 credits |
| `plans()` | `/plans` | No key, 0 credits |
| `status()` | `/status` | No key, 0 credits |
| `stats()` | `/stats` | No key, 0 credits |
| `sample()` | `/sample` | No key, 0 credits |
<!-- methods:end -->

Plus `paginate(method, params, { maxPages })`, `feed.iterate(params, { onCursor })`, `export.rows(product)`, `export.stream(product)` and `get(path, query)`.

## Errors

Every failure throws `SatelitError`:

| Property | |
|---|---|
| `status` | HTTP status; `0` for a timeout or a network error |
| `code` | the API's code, or `timeout`, `network_error`, `bad_response`, `export_incomplete` |
| `message` | the API's message, in the call's language |
| `docs` | the error's page, such as `https://developer.satelit.md/en/errors/#invalid` |
| `fields` | for `invalid`: the parameters that were wrong, such as `['code']` |
| `retryAfter` | seconds, from `Retry-After` |
| `choose` | for `plan_required` without a plan: the pricing page |
| `rate` | the credit and rate headers of the failed answer |

| Status | `code` | What to do |
|---|---|---|
| 401 | `auth_required`, `key_invalid` | check the key |
| 402 | `plan_required` | the plan does not include this; see `choose` or the pricing page |
| 403 | `not_available`, `account_suspended` | the product is closed, or the account is |
| 404 | `not_found` | no such id |
| 422 | `invalid` | fix `fields` |
| 429 | `rate_limited` | retried for you after `Retry-After` (at most 3 times) |
| 429 | `quota_exceeded` | out of credits this period: never retried; buy a pack or wait for the reset |
| 429 | `export_running` | one export at a time per account |
| 503 | `busy` | retried for you when `Retry-After` is given |

```js
try {
  await satelit.rates.history({ code: '' });
} catch (e) {
  if (!(e instanceof SatelitError)) throw e;
  console.log(e.status, e.code, e.fields, e.docs);
  // 422 invalid [ 'code' ] https://developer.satelit.md/en/errors/#invalid
}
```

A timeout aborts the attempt and throws `code: 'timeout'`; your own `signal` aborting throws its reason unchanged. A `Retry-After` over 60 seconds is not waited for. More: [errors](https://developer.satelit.md/en/errors/), [rate limits](https://developer.satelit.md/en/rate-limits/).

## Caching and credits

A credit is charged only on a 2xx answer. Most calls cost 1 to 5 credits; **every Movies call costs 40** (`movies.titleFull` 55), except `movies.genres` (0) and the keyless `movies.board`. Keep answers and reuse them; the sources do not change faster than this:

| Data | Keep it for |
|---|---|
| rates (BNM publishes once a working day) | 1 to 6 h |
| fuel | 1 to 3 h |
| shop prices, deals | 1 to 6 h |
| news | 10 to 15 min |
| cinema schedules | 1 to 3 h |
| a film's or person's details | 24 h or more |

The examples use a small file cache ([`examples/cache.mjs`](examples/cache.mjs)); on a server, any cache you already have will do (Redis, a KV store, a map with timestamps). Read `rate.creditsRemaining` to watch the balance, or call `satelit.me()` (free).

**Attribution.** Wherever you show the data, show `meta.attribution` when it is not null (rates carry BNM's line `Sursa: Banca Națională a Moldovei, bnm.md, CC BY 4.0`, OpenStreetMap places their ODbL line) and a small "Data: Satelit (satelit.md)" link. Show the shop's name with every shop price.

## Examples

| Script | Shows | Credits per fresh run |
|---|---|---|
| [`examples/rates-table.mjs`](examples/rates-table.mjs) | today's BNM rates as a table | 1 |
| [`examples/fuel-cheapest.mjs`](examples/fuel-cheapest.mjs) | the cheapest network per fuel, next to ANRE's cap | 1 |
| [`examples/price-search.mjs`](examples/price-search.mjs) `"lapte"` | product search, then every shop's offer | 5 |
| [`examples/cinema-today.mjs`](examples/cinema-today.mjs) `[city]` | today's sessions in every cinema | 0 (keyless) |

```sh
export SATELIT_API_KEY=sat_live_…   # PowerShell: $env:SATELIT_API_KEY = "sat_live_…"
node examples/rates-table.mjs
```

Real output of `node examples/price-search.mjs` on 19 Nov 2026:

```
"lapte": 100 products, the first 5:

  Lapte Casuta Mea 2.5% 1 l: from 15.99 MDL in 4 shops
  Lapte JLC 2.5% 1 l: from 16.99 MDL in 4 shops
  ...
Offers for Lapte Casuta Mea 2.5% 1 l:
  METRO              15.99 MDL (was 17.90)
  Bonus              18.30 MDL, out of stock
  Linella            18.99 MDL
  MegaAlina          18.99 MDL

Source: Bonus, Linella, METRO, MegaAlina | Data: Satelit (satelit.md)
```

## Development

```sh
npm install
npm run generate     # src/types.ts, src/resources.ts and the table above, from spec/
npm run build        # dist/esm and dist/cjs
npm run typecheck
npm test             # offline: mocked fetch, plus real answers checked against the schemas
SATELIT_API_KEY=sat_live_… npm run test:live   # about 60 credits
```

To follow a newer API: `curl -o spec/openapi.json https://api.satelit.md/openapi.json`, add any new route to `spec/methods.json`, then `npm run check`. Commit `dist/` with the change: a GitHub install uses it as is.

## Tested with

| | Versions | What ran |
|---|---|---|
| Node.js | 18.20.7, 24.13.0 | offline tests, live tests against api.satelit.md |
| Node.js | 20.16.0 | offline tests |
| TypeScript | 5.9.3 | build, `test/usage.ts`, and a consumer project with `NodeNext` and `node10` resolution |
| Chrome (headless) | 154.0.8037.57 | the ES module build in a page: keyless calls, CORS headers read, the key guard |
| npm | 10.8.0 | `npm pack` tarball and a `git+file:` install of this repository in a fresh project |
| OS | Windows 11 | all of the above |

Other runtimes with a standard `fetch` (Deno, Bun, Cloudflare Workers) were not tested. CI runs the offline tests on Node 18, 20 and 22. The SDK's `User-Agent` (`satelit-js/1.0.0`) was accepted by the API's edge on every live call.

## Troubleshooting

- **401 `auth_required`**: no key reached the API. Set `SATELIT_API_KEY` or pass `apiKey`.
- **402 `plan_required`** on `feed` or `export`: those need Business (feed) or Enterprise (export).
- **429 `quota_exceeded`**: this period's credits are spent; `rate.creditsReset` says when they return.
- **`timeout`**: the default is 10 s per attempt; raise `timeoutMs` for heavy calls.
- **"an API key in a browser is visible to every visitor"**: move the call to a server (see Configure).
- **`TypeError: No fetch`**: the runtime has no global `fetch`; pass one with the `fetch` option.

## Links

[Docs](https://developer.satelit.md/en/docs/) · [API reference](https://developer.satelit.md/en/reference/) · [Errors](https://developer.satelit.md/en/errors/) · [Rate limits](https://developer.satelit.md/en/rate-limits/) · [Authentication](https://developer.satelit.md/en/authentication/) · [Webhooks](https://developer.satelit.md/en/webhooks/) · [MCP](https://developer.satelit.md/en/mcp/) · [Pricing](https://developer.satelit.md/en/pricing/) · [Console](https://developer.satelit.md/en/console/) · [OpenAPI](https://api.satelit.md/openapi.json)

## Pe scurt (română)

SDK-ul oficial JavaScript/TypeScript pentru API-ul de date Satelit: cursurile BNM, carburanți, tarife, prețuri în magazine, legi, știri, companii, instanțe, filme și cinematografe. Fără dependențe, ESM și CommonJS, tipuri pentru fiecare rută. Instalare: `npm install github:Satelit-Moldova/satelit-js`. Cheia (`sat_live_…`) se ia din [consolă](https://developer.satelit.md/en/console/) și se ține doar pe server, niciodată în pagina din browser. Fiecare apel întoarce `{ data, meta, rate }`; erorile sunt `SatelitError` cu `status`, `code`, `message`, `docs`. Păstrați răspunsurile în cache (cursurile câteva ore, știrile 10-15 minute): un apel Movies costă 40 de credite. Afișați `meta.attribution` și „Date: Satelit (satelit.md)” lângă date.

## License

MIT, see [LICENSE](LICENSE).
