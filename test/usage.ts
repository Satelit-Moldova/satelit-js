// Compiled by `npm run typecheck` (never run): the public types must allow these calls and refuse the wrong ones.
import { Satelit, SatelitError } from '../src/index.js';
import type { ApiResponse, Rate, MovieList, NewsCard } from '../src/index.js';

export async function usage(s: Satelit): Promise<void> {
  const rates: ApiResponse<Rate[]> = await s.rates.list({ lang: 'en' });
  const eur: number | undefined = rates.data.find((r) => r.code === 'EUR')?.value;
  const credits: number | null = rates.rate.creditsRemaining;
  const attribution: string | null = rates.meta.attribution;
  void [eur, credits, attribution];

  await s.rates.history({ code: 'EUR', days: 30 });
  // @ts-expect-error code is required
  await s.rates.history({ days: 30 });
  // @ts-expect-error fuel is a95, diesel or lpg
  await s.fuel.history({ fuel: 'a98' });
  await s.news.events.comments('e1', { sort: 'top', per: 5 });
  const m: ApiResponse<MovieList> = await s.movies.search({ q: 'matrix' });
  const first = m.data.results[0];
  if (first && first.kind !== 'person') void first.title;
  // @ts-expect-error region is a known enum
  s.paginate(s.news.list, { region: 'mars' });
  for await (const card of s.paginate(s.news.list, { region: 'chisinau' }, { maxPages: 2 })) {
    const c: NewsCard = card;
    void c;
  }
  for await (const ev of s.feed.iterate({ types: ['news.published'] })) void ev.type;
  for await (const row of s.export.rows('rates')) void row;
  try {
    await s.me();
  } catch (e) {
    if (e instanceof SatelitError) void [e.status, e.code, e.fields, e.retryAfter, e.docs];
  }
}
