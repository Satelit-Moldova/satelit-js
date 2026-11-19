import type { ApiResponse, CallOptions } from './core.js';
import type { FeedListParams } from './resources.js';
import type { FeedEvent } from './types.js';
/** `feed.iterate()`, added to the generated `FeedApi`. */
export declare abstract class FeedHelpers {
    abstract readonly list: (params?: FeedListParams, opts?: CallOptions) => Promise<ApiResponse<FeedEvent[]>>;
    /**
     * Yields events oldest first, following `meta.next` until `meta.has_more` is false.
     * Keep the last event's cursor (`meta.next`, also passed to `onCursor`) and start from it next time.
     * Business and Enterprise plans; others get 402 `plan_required`.
     */
    iterate(params?: FeedListParams, opts?: CallOptions & {
        onCursor?: (next: string) => void;
        maxPages?: number;
    }): AsyncGenerator<FeedEvent, string | undefined, undefined>;
}
