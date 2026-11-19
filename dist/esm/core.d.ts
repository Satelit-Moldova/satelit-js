import type { Meta } from './types.js';
export declare const VERSION = "1.0.0";
export declare const DEFAULT_BASE_URL = "https://api.satelit.md/v1";
/** Answer language. Romanian is the default. */
export type Lang = 'ro' | 'ru' | 'en' | 'uk';
export interface SatelitOptions {
    /** `sat_live_…`. Defaults to `process.env.SATELIT_API_KEY` where `process` exists. Keyless routes work without it. */
    apiKey?: string;
    /** Default answer language (`ro`, `ru`, `en`, `uk`). */
    lang?: Lang;
    /** Defaults to `https://api.satelit.md/v1`. */
    baseUrl?: string;
    /** Time for one attempt, headers and body, in ms. Default 10 000. */
    timeoutMs?: number;
    /** Retries of 429 `rate_limited` and 503 with `Retry-After`. Default 2, at most 3. */
    maxRetries?: number;
    /** A `fetch` implementation. Defaults to the global `fetch`. */
    fetch?: typeof fetch;
    /** Extra headers on every request. */
    headers?: Record<string, string>;
    /**
     * A key in browser code is readable by every visitor. The client refuses a key in a page
     * unless this is true (for a key you mean to expose, such as on a private intranet tool).
     * Keyless routes (`sample`, `movies.board`, …) work in a browser without it.
     */
    allowBrowser?: boolean;
}
export interface CallOptions {
    /** Language for this call only. */
    lang?: Lang;
    /** Cancels the call (and any retry wait). */
    signal?: AbortSignal;
    /** Overrides the client's `timeoutMs` for this call. */
    timeoutMs?: number;
}
/** What the rate-limit and credit headers said. `null` when a header was absent. */
export interface RateInfo {
    /** Requests allowed per window (`X-RateLimit-Limit`). */
    limit: number | null;
    remaining: number | null;
    /** Seconds until the window resets. */
    reset: number | null;
    /** Credits this call cost (`X-Credits-Cost`). */
    creditsCost: number | null;
    creditsLimit: number | null;
    creditsRemaining: number | null;
    /** When the credit period resets, ISO 8601. */
    creditsReset: string | null;
    /** Seconds to wait, from `Retry-After`. */
    retryAfter: number | null;
}
/** Every call resolves to the answer's `data`, its `meta`, and the headers' credit and rate info. */
export interface ApiResponse<T> {
    data: T;
    meta: Meta;
    rate: RateInfo;
}
export type QueryValue = string | number | boolean | null | undefined | ReadonlyArray<string | number>;
export type Query = {
    [key: string]: QueryValue;
} | object;
/** What the generated namespaces need from the client. */
export interface Transport {
    get<T>(path: string, query?: Query, opts?: CallOptions): Promise<ApiResponse<T>>;
    /** @internal */
    raw(path: string, query?: Query, opts?: CallOptions & {
        accept?: string;
    }): Promise<Response>;
}
/** A list method that takes `page`, such as `client.tours.list`. */
export type PagedMethod = (params: any, opts?: CallOptions) => Promise<ApiResponse<readonly unknown[]>>;
/** The item type of a paged method's list. */
export type PageItem<M extends PagedMethod> = Awaited<ReturnType<M>>['data'][number];
/** Encodes one path segment. */
export declare function seg(v: string | number): string;
export declare function parseRate(h: Headers): RateInfo;
/** The HTTP core: auth, query, timeouts, retries and errors. `Satelit` adds the typed namespaces on top. */
export declare class SatelitCore implements Transport {
    #private;
    readonly baseUrl: string;
    readonly lang: Lang | undefined;
    readonly timeoutMs: number;
    readonly maxRetries: number;
    /** `meta` of the last successful answer. */
    lastMeta: Meta | null;
    /** Credit and rate info of the last answer, also of an error. */
    lastRate: RateInfo | null;
    constructor(options?: SatelitOptions);
    /** Whether the client holds a key (the key itself is never exposed). */
    get hasKey(): boolean;
    /** Builds the full URL of a route. Arrays join with commas; `null`/`undefined` are left out. */
    url(path: string, query?: Query, lang?: Lang): string;
    /**
     * Any GET route as `{data, meta, rate}`: an escape hatch for routes newer than this SDK.
     * `client.get('/rates/history', { code: 'EUR', days: 30 })`
     */
    get<T = unknown>(path: string, query?: Query, opts?: CallOptions): Promise<ApiResponse<T>>;
    /** @internal The raw `Response` of a 2xx, after retries; the timeout covers the headers only. */
    raw(path: string, query?: Query, opts?: CallOptions & {
        accept?: string;
    }): Promise<Response>;
    /**
     * Walks every page of a paged list (`meta.page`) and yields its items.
     * `for await (const t of client.paginate(client.tours.list, { country: 'Turcia' })) …`
     * Each page is one call and costs its credits; `maxPages` bounds the walk.
     */
    paginate<M extends PagedMethod>(method: M, params?: Parameters<M>[0], options?: CallOptions & {
        maxPages?: number;
    }): AsyncGenerator<PageItem<M>, void, undefined>;
}
