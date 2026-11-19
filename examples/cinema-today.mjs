// What is on in Moldova's cinemas today.   node examples/cinema-today.mjs [city]
// movies.board needs no key and costs 0 credits; cached 1 h. (movies.today, with a city or a date, costs 40.)
import { Satelit, SatelitError } from '@satelit-moldova/sdk';
import { cached, attributionLine } from './cache.mjs';

// Lowercase without diacritics, so "chisinau" finds "Chișinău".
const plain = (t) => t.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
const city = plain(process.argv[2] || '');
const satelit = new Satelit({ lang: 'en' });

try {
  const { data, meta } = await cached('board:en', 3600, () => satelit.movies.board());
  console.log(`Cinemas on ${data.day}\n`);
  for (const { cinema, films } of data.cinemas) {
    if (city && !plain(cinema.city ?? '').includes(city)) continue;
    console.log(`${cinema.name} (${cinema.city})`);
    for (const f of films) {
      const times = f.sessions.filter((s) => s.date === data.day).map((s) => s.time);
      const title = f.title ?? f.listed_title ?? '';
      if (times.length) console.log(`  ${title.slice(0, 34).padEnd(34)} ${times.join('  ')}`);
    }
    console.log();
  }
  console.log(attributionLine(meta));
} catch (e) {
  if (!(e instanceof SatelitError)) throw e;
  console.error(`Satelit ${e.status} ${e.code}: ${e.message}`);
  process.exitCode = 1;
}
