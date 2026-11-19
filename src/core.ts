import { SatelitError } from './errors.js';
import type { Meta } from './types.js';

export const VERSION = '1.0.0';
export const DEFAULT_BASE_URL = 'https://api.satelit.md/v1';

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
export type Query = { [key: string]: QueryValue } | object;

/** What the generated namespaces need from the client. */
export interface Transport {
  get<T>(path: string, query?: Query, opts?: CallOptions): Promise<ApiResponse<T>>;
  /** @internal */
  raw(path: string, query?: Query, opts?: CallOptions & { accept?: string }): Promise<Response>;
}

/** A list method that takes `page`, such as `client.tours.list`. */
export type PagedMethod = (params: any, opts?: CallOptions) => Promise<ApiResponse<readonly unknown[]>>;
/** The item type of a paged method's list. */
export type PageItem<M extends PagedMethod> = Awaited<ReturnType<M>>['data'][number];

const MAX_RETRIES = 3;
/** A `Retry-After` longer than this is not waited for: the error is thrown. */
const MAX_WAIT_S = 60;

/** Encodes one path segment. */
export function seg(v: string | number): string {
  return encodeURIComponent(String(v));
}

function num(h: Headers, name: string): number | null {
  const v = h.get(name);
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseRate(h: Headers): RateInfo {
  return {
    limit: num(h, 'x-ratelimit-limit'),
    remaining: num(h, 'x-ratelimit-remaining'),
    reset: num(h, 'x-ratelimit-reset'),
    creditsCost: num(h, 'x-credits-cost'),
    creditsLimit: num(h, 'x-credits-limit'),
    creditsRemaining: num(h, 'x-credits-remaining'),
    creditsReset: h.get('x-credits-reset'),
    retryAfter: num(h, 'retry-after'),
  };
}

function envKey(): string | undefined {
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return p?.env?.SATELIT_API_KEY || undefined;
}

// Browsers refuse to set User-Agent; everywhere else the SDK names itself.
const IN_BROWSER = typeof (globalThis as { document?: unknown }).document !== 'undefined';

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }
    function onAbort() {
      clearTimeout(t);
      reject(signal!.reason);
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** The HTTP core: auth, query, timeouts, retries and errors. `Satelit` adds the typed namespaces on top. */
export class SatelitCore implements Transport {
  readonly baseUrl: string;
  readonly lang: Lang | undefined;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  /** `meta` of the last successful answer. */
  lastMeta: Meta | null = null;
  /** Credit and rate info of the last answer, also of an error. */
  lastRate: RateInfo | null = null;
  readonly #apiKey: string | undefined;
  readonly #fetch: typeof fetch;
  readonly #headers: Record<string, string>;

  constructor(options: SatelitOptions = {}) {
    this.#apiKey = options.apiKey ?? envKey();
    if (this.#apiKey && IN_BROWSER && !options.allowBrowser) {
      throw new Error(
        'Satelit: an API key in a browser is visible to every visitor. Call the API from your server or a small proxy ' +
          '(see the README), or pass allowBrowser: true if you really mean to expose this key.',
      );
    }
    this.lang = options.lang;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = Math.max(0, Math.min(MAX_RETRIES, options.maxRetries ?? 2));
    const f = options.fetch ?? globalThis.fetch;
    if (typeof f !== 'function') throw new TypeError('No fetch: pass options.fetch or use a runtime with a global fetch.');
    // Bound, so a global fetch keeps its receiver (Workers and browsers require it).
    this.#fetch = options.fetch ?? f.bind(globalThis);
    this.#headers = { ...options.headers };
  }

  /** Whether the client holds a key (the key itself is never exposed). */
  get hasKey(): boolean {
    return Boolean(this.#apiKey);
  }

  /** Builds the full URL of a route. Arrays join with commas; `null`/`undefined` are left out. */
  url(path: string, query?: Query, lang?: Lang): string {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {}) as [string, QueryValue][]) {
      if (v === undefined || v === null) continue;
      qs.append(k, Array.isArray(v) ? v.join(',') : String(v));
    }
    const l = lang ?? this.lang;
    if (l && !qs.has('lang')) qs.set('lang', l);
    const s = qs.toString();
    return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}${s ? '?' + s : ''}`;
  }

  /**
   * Any GET route as `{data, meta, rate}`: an escape hatch for routes newer than this SDK.
   * `client.get('/rates/history', { code: 'EUR', days: 30 })`
   */
  async get<T = unknown>(path: string, query?: Query, opts: CallOptions = {}): Promise<ApiResponse<T>> {
    return this.#request(path, query, opts, 'application/json', async (res, rate) => {
      const text = await res.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        throw new SatelitError({ status: res.status, code: 'bad_response', message: 'The answer is not JSON.', rate });
      }
      if (!body || typeof body !== 'object' || !('data' in body)) {
        throw new SatelitError({ status: res.status, code: 'bad_response', message: 'The answer has no `data`.', rate });
      }
      const b = body as { data: T; meta?: Meta };
      const meta = (b.meta ?? { credits: 0, updated_at: null, sources: [], attribution: null }) as Meta;
      this.lastMeta = meta;
      return { data: b.data, meta, rate };
    });
  }

  /** @internal The raw `Response` of a 2xx, after retries; the timeout covers the headers only. */
  async raw(path: string, query?: Query, opts: CallOptions & { accept?: string } = {}): Promise<Response> {
    return this.#request(path, query, opts, opts.accept ?? '*/*', async (res) => res, true);
  }

  /**
   * Walks every page of a paged list (`meta.page`) and yields its items.
   * `for await (const t of client.paginate(client.tours.list, { country: 'Turcia' })) …`
   * Each page is one call and costs its credits; `maxPages` bounds the walk.
   */
  async *paginate<M extends PagedMethod>(
    method: M,
    params?: Parameters<M>[0],
    options: CallOptions & { maxPages?: number } = {},
  ): AsyncGenerator<PageItem<M>, void, undefined> {
    const { maxPages = Infinity, ...opts } = options;
    let page: number = (params as { page?: number } | undefined)?.page ?? 1;
    for (let n = 0; n < maxPages; n++) {
      const r = await method({ ...(params as object), page }, opts);
      for (const item of r.data) yield item as PageItem<M>;
      const p = r.meta.page;
      if (!p || page >= p.pages || r.data.length === 0) return;
      page += 1;
    }
  }

  async #request<R>(
    path: string,
    query: Query | undefined,
    opts: CallOptions,
    accept: string,
    read: (res: Response, rate: RateInfo) => Promise<R>,
    stream = false,
  ): Promise<R> {
    const url = this.url(path, query, opts.lang);
    const headers: Record<string, string> = { Accept: accept, ...this.#headers };
    if (this.#apiKey) headers.Authorization = `Bearer ${this.#apiKey}`;
    if (!IN_BROWSER) headers['User-Agent'] = `satelit-js/${VERSION}`;
    const timeoutMs = opts.timeoutMs ?? this.timeoutMs;

    for (let attempt = 0; ; attempt++) {
      const ctrl = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        ctrl.abort();
      }, timeoutMs);
      const onAbort = () => ctrl.abort(opts.signal!.reason);
      if (opts.signal) {
        if (opts.signal.aborted) {
          clearTimeout(timer);
          throw opts.signal.reason;
        }
        opts.signal.addEventListener('abort', onAbort, { once: true });
      }
      const cleanup = () => {
        clearTimeout(timer);
        opts.signal?.removeEventListener('abort', onAbort);
      };
      let res: Response;
      try {
        res = await this.#fetch(url, { method: 'GET', headers, signal: ctrl.signal });
      } catch (e) {
        cleanup();
        throw this.#netError(e, timedOut, timeoutMs, opts.signal);
      }
      const rate = parseRate(res.headers);
      this.lastRate = rate;
      if (res.ok) {
        if (stream) {
          clearTimeout(timer); // a stream may run long; the caller's signal still cancels it
          return read(res, rate);
        }
        try {
          return await read(res, rate);
        } catch (e) {
          throw e instanceof SatelitError ? e : this.#netError(e, timedOut, timeoutMs, opts.signal);
        } finally {
          cleanup();
        }
      }
      let err: SatelitError;
      try {
        err = await SatelitError.fromResponse(res, rate);
      } catch (e) {
        throw this.#netError(e, timedOut, timeoutMs, opts.signal);
      } finally {
        cleanup();
      }
      const wait = this.#retryWait(err, attempt);
      if (wait == null) throw err;
      await sleep(wait, opts.signal);
    }
  }

  // Only 429 `rate_limited` and 503 with Retry-After are retried, never `quota_exceeded`.
  #retryWait(err: SatelitError, attempt: number): number | null {
    if (attempt >= this.maxRetries) return null;
    const ra = err.retryAfter;
    if (err.status === 429 && err.code === 'rate_limited') {
      if (ra != null) return ra <= MAX_WAIT_S ? ra * 1000 : null;
      return 1000 * 2 ** attempt;
    }
    if (err.status === 503 && ra != null) return ra <= MAX_WAIT_S ? ra * 1000 : null;
    return null;
  }

  #netError(e: unknown, timedOut: boolean, timeoutMs: number, signal?: AbortSignal): unknown {
    if (signal?.aborted) return signal.reason ?? e; // the caller cancelled: rethrow as is
    if (timedOut) return new SatelitError({ status: 0, code: 'timeout', message: `No answer in ${timeoutMs} ms.` });
    const msg = e instanceof Error ? e.message : String(e);
    return new SatelitError({ status: 0, code: 'network_error', message: `Network error: ${msg}`, cause: e });
  }
}
