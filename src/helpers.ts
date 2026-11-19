import type { ApiResponse, CallOptions } from './core.js';
import type { FeedListParams } from './resources.js';
import type { FeedEvent } from './types.js';

/** `feed.iterate()`, added to the generated `FeedApi`. */
export abstract class FeedHelpers {
  abstract readonly list: (params?: FeedListParams, opts?: CallOptions) => Promise<ApiResponse<FeedEvent[]>>;

  /**
   * Yields events oldest first, following `meta.next` until `meta.has_more` is false.
   * Keep the last event's cursor (`meta.next`, also passed to `onCursor`) and start from it next time.
   * Business and Enterprise plans; others get 402 `plan_required`.
   */
  async *iterate(
    params: FeedListParams = {},
    opts: CallOptions & { onCursor?: (next: string) => void; maxPages?: number } = {},
  ): AsyncGenerator<FeedEvent, string | undefined, undefined> {
    const { onCursor, maxPages = Infinity, ...call } = opts;
    let after = params.after;
    for (let n = 0; n < maxPages; n++) {
      const r = await this.list({ ...params, after }, call);
      for (const ev of r.data) yield ev;
      const next = r.meta.next ?? undefined;
      if (next) {
        after = next;
        onCursor?.(next);
      }
      if (!r.meta.has_more || !next || r.data.length === 0) break;
    }
    return after;
  }
}
