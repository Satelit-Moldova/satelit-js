// Which station network sells each fuel cheapest today, next to ANRE's cap.   node examples/fuel-cheapest.mjs
// 1 credit per fresh call; cached 2 h.
import { Satelit, SatelitError } from '@satelit-moldova/sdk';
import { cached, attributionLine } from './cache.mjs';

const satelit = new Satelit({ lang: 'en' });
const LABEL = { a95: 'Petrol A95', diesel: 'Diesel', lpg: 'LPG' };

try {
  const { data, meta, cached: hit } = await cached('fuel:en', 2 * 3600, () => satelit.fuel.today());
  console.log(`Fuel prices on ${data.date}, MDL per litre\n`);
  for (const fuel of ['a95', 'diesel', 'lpg']) {
    const range = data.range?.[fuel];
    if (!range) continue;
    // Every network at the lowest price, not only the first one named.
    const cheapest = data.networks.filter((n) => n.prices[fuel] === range.min).map((n) => n.name);
    const cap = data.cap?.[fuel];
    console.log(
      `${LABEL[fuel].padEnd(11)} ${range.min.toFixed(2)} at ${cheapest.join(', ')}` +
        `  (dearest ${range.max.toFixed(2)}, ${range.networks} networks${cap ? `, ANRE cap ${cap.toFixed(2)}` : ''})`,
    );
  }
  console.log('\n' + attributionLine(meta) + (hit ? '  (from the cache)' : ''));
} catch (e) {
  if (!(e instanceof SatelitError)) throw e;
  console.error(`Satelit ${e.status} ${e.code}: ${e.message}`);
  process.exitCode = 1;
}
