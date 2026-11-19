// Search shop prices and show the offers of the first match.   node examples/price-search.mjs "lapte 2.5"
// prices.search costs 3 credits, prices.item 2; both cached 3 h.
import { Satelit, SatelitError } from '@satelit-moldova/sdk';
import { cached, attributionLine } from './cache.mjs';

const q = process.argv.slice(2).join(' ') || 'lapte';
const satelit = new Satelit({ lang: 'ro' });

try {
  const found = await cached(`prices:ro:${q}`, 3 * 3600, () => satelit.prices.search({ q }));
  if (!found.data.length) {
    console.log(`Nothing found for "${q}".`);
  } else {
    console.log(`"${q}": ${found.meta.page?.total ?? found.data.length} products, the first ${Math.min(5, found.data.length)}:\n`);
    for (const p of found.data.slice(0, 5)) {
      console.log(`  ${p.name}: from ${p.min_price.toFixed(2)} MDL in ${p.stores} shops`);
    }
    const first = found.data[0];
    const item = await cached(`item:ro:${first.id}`, 3 * 3600, () => satelit.prices.item(first.id));
    console.log(`\nOffers for ${item.data.name}:`);
    for (const o of [...item.data.offers].sort((a, b) => a.price - b.price).slice(0, 8)) {
      // A shop price is always shown with the shop's name.
      const was = o.old_price ? ` (was ${o.old_price.toFixed(2)})` : '';
      console.log(`  ${o.store.name.padEnd(18)} ${o.price.toFixed(2)} MDL${was}${o.in_stock === false ? ', out of stock' : ''}`);
    }
    console.log('\n' + attributionLine(item.meta));
  }
} catch (e) {
  if (!(e instanceof SatelitError)) throw e;
  console.error(`Satelit ${e.status} ${e.code}: ${e.message}`);
  process.exitCode = 1;
}
