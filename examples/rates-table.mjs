// Today's official leu rates (BNM) as a table.   node examples/rates-table.mjs [EUR,USD,RON,...]
// 1 credit per fresh call; cached 3 h (BNM publishes once a working day).
import { Satelit, SatelitError } from '@satelit-moldova/sdk';
import { cached, attributionLine } from './cache.mjs';

const want = (process.argv[2] || 'EUR,USD,RON,UAH,GBP').toUpperCase().split(',');
const satelit = new Satelit({ lang: 'en' }); // the key comes from SATELIT_API_KEY

try {
  const { data, meta, rate, cached: hit } = await cached('rates:en', 3 * 3600, () => satelit.rates.list());
  const rows = data
    .filter((r) => want.includes(r.code))
    .map((r) => ({
      code: r.code,
      name: r.name,
      'MDL per unit': +(r.value / r.nominal).toFixed(4),
      '7 days %': r.change_7d_pct,
      '30 days %': r.change_30d_pct,
      date: r.date,
    }));
  console.table(rows);
  console.log(attributionLine(meta));
  if (meta.notice) console.log(meta.notice);
  console.log(hit ? '(from the cache)' : `(fresh: ${rate.creditsCost} credit, ${rate.creditsRemaining} left this period)`);
} catch (e) {
  if (!(e instanceof SatelitError)) throw e;
  console.error(`Satelit ${e.status} ${e.code}: ${e.message} ${e.docs ?? ''}`);
  process.exitCode = 1;
}
