"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatelitCore = exports.DEFAULT_BASE_URL = exports.VERSION = void 0;
exports.seg = seg;
exports.parseRate = parseRate;
const errors_js_1 = require("./errors.js");
exports.VERSION = '1.0.0';
exports.DEFAULT_BASE_URL = 'https://api.satelit.md/v1';
const MAX_RETRIES = 3;
/** A `Retry-After` longer than this is not waited for: the error is thrown. */
const MAX_WAIT_S = 60;
/** Encodes one path segment. */
function seg(v) {
    return encodeURIComponent(String(v));
}
function num(h, name) {
    const v = h.get(name);
    if (v == null || v === '')
        return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}
function parseRate(h) {
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
function envKey() {
    const p = globalThis.process;
    return p?.env?.SATELIT_API_KEY || undefined;
}
// Browsers refuse to set User-Agent; everywhere else the SDK names itself.
const IN_BROWSER = typeof globalThis.document !== 'undefined';
function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted)
            return reject(signal.reason);
        const t = setTimeout(done, ms);
        function done() {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }
        function onAbort() {
            clearTimeout(t);
            reject(signal.reason);
        }
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
/** The HTTP core: auth, query, timeouts, retries and errors. `Satelit` adds the typed namespaces on top. */
class SatelitCore {
    baseUrl;
    lang;
    timeoutMs;
    maxRetries;
    /** `meta` of the last successful answer. */
    lastMeta = null;
    /** Credit and rate info of the last answer, also of an error. */
    lastRate = null;
    #apiKey;
    #fetch;
    #headers;
    constructor(options = {}) {
        this.#apiKey = options.apiKey ?? envKey();
        if (this.#apiKey && IN_BROWSER && !options.allowBrowser) {
            throw new Error('Satelit: an API key in a browser is visible to every visitor. Call the API from your server or a small proxy ' +
                '(see the README), or pass allowBrowser: true if you really mean to expose this key.');
        }
        this.lang = options.lang;
        this.baseUrl = (options.baseUrl ?? exports.DEFAULT_BASE_URL).replace(/\/+$/, '');
        this.timeoutMs = options.timeoutMs ?? 10_000;
        this.maxRetries = Math.max(0, Math.min(MAX_RETRIES, options.maxRetries ?? 2));
        const f = options.fetch ?? globalThis.fetch;
        if (typeof f !== 'function')
            throw new TypeError('No fetch: pass options.fetch or use a runtime with a global fetch.');
        // Bound, so a global fetch keeps its receiver (Workers and browsers require it).
        this.#fetch = options.fetch ?? f.bind(globalThis);
        this.#headers = { ...options.headers };
    }
    /** Whether the client holds a key (the key itself is never exposed). */
    get hasKey() {
        return Boolean(this.#apiKey);
    }
    /** Builds the full URL of a route. Arrays join with commas; `null`/`undefined` are left out. */
    url(path, query, lang) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(query ?? {})) {
            if (v === undefined || v === null)
                continue;
            qs.append(k, Array.isArray(v) ? v.join(',') : String(v));
        }
        const l = lang ?? this.lang;
        if (l && !qs.has('lang'))
            qs.set('lang', l);
        const s = qs.toString();
        return `${this.baseUrl}${path.startsWith('/') ? path : '/' + path}${s ? '?' + s : ''}`;
    }
    /**
     * Any GET route as `{data, meta, rate}`: an escape hatch for routes newer than this SDK.
     * `client.get('/rates/history', { code: 'EUR', days: 30 })`
     */
    async get(path, query, opts = {}) {
        return this.#request(path, query, opts, 'application/json', async (res, rate) => {
            const text = await res.text();
            let body;
            try {
                body = JSON.parse(text);
            }
            catch {
                throw new errors_js_1.SatelitError({ status: res.status, code: 'bad_response', message: 'The answer is not JSON.', rate });
            }
            if (!body || typeof body !== 'object' || !('data' in body)) {
                throw new errors_js_1.SatelitError({ status: res.status, code: 'bad_response', message: 'The answer has no `data`.', rate });
            }
            const b = body;
            const meta = (b.meta ?? { credits: 0, updated_at: null, sources: [], attribution: null });
            this.lastMeta = meta;
            return { data: b.data, meta, rate };
        });
    }
    /** @internal The raw `Response` of a 2xx, after retries; the timeout covers the headers only. */
    async raw(path, query, opts = {}) {
        return this.#request(path, query, opts, opts.accept ?? '*/*', async (res) => res, true);
    }
    /**
     * Walks every page of a paged list (`meta.page`) and yields its items.
     * `for await (const t of client.paginate(client.tours.list, { country: 'Turcia' })) …`
     * Each page is one call and costs its credits; `maxPages` bounds the walk.
     */
    async *paginate(method, params, options = {}) {
        const { maxPages = Infinity, ...opts } = options;
        let page = params?.page ?? 1;
        for (let n = 0; n < maxPages; n++) {
            const r = await method({ ...params, page }, opts);
            for (const item of r.data)
                yield item;
            const p = r.meta.page;
            if (!p || page >= p.pages || r.data.length === 0)
                return;
            page += 1;
        }
    }
    async #request(path, query, opts, accept, read, stream = false) {
        const url = this.url(path, query, opts.lang);
        const headers = { Accept: accept, ...this.#headers };
        if (this.#apiKey)
            headers.Authorization = `Bearer ${this.#apiKey}`;
        if (!IN_BROWSER)
            headers['User-Agent'] = `satelit-js/${exports.VERSION}`;
        const timeoutMs = opts.timeoutMs ?? this.timeoutMs;
        for (let attempt = 0;; attempt++) {
            const ctrl = new AbortController();
            let timedOut = false;
            const timer = setTimeout(() => {
                timedOut = true;
                ctrl.abort();
            }, timeoutMs);
            const onAbort = () => ctrl.abort(opts.signal.reason);
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
            let res;
            try {
                res = await this.#fetch(url, { method: 'GET', headers, signal: ctrl.signal });
            }
            catch (e) {
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
                }
                catch (e) {
                    throw e instanceof errors_js_1.SatelitError ? e : this.#netError(e, timedOut, timeoutMs, opts.signal);
                }
                finally {
                    cleanup();
                }
            }
            let err;
            try {
                err = await errors_js_1.SatelitError.fromResponse(res, rate);
            }
            catch (e) {
                throw this.#netError(e, timedOut, timeoutMs, opts.signal);
            }
            finally {
                cleanup();
            }
            const wait = this.#retryWait(err, attempt);
            if (wait == null)
                throw err;
            await sleep(wait, opts.signal);
        }
    }
    // Only 429 `rate_limited` and 503 with Retry-After are retried, never `quota_exceeded`.
    #retryWait(err, attempt) {
        if (attempt >= this.maxRetries)
            return null;
        const ra = err.retryAfter;
        if (err.status === 429 && err.code === 'rate_limited') {
            if (ra != null)
                return ra <= MAX_WAIT_S ? ra * 1000 : null;
            return 1000 * 2 ** attempt;
        }
        if (err.status === 503 && ra != null)
            return ra <= MAX_WAIT_S ? ra * 1000 : null;
        return null;
    }
    #netError(e, timedOut, timeoutMs, signal) {
        if (signal?.aborted)
            return signal.reason ?? e; // the caller cancelled: rethrow as is
        if (timedOut)
            return new errors_js_1.SatelitError({ status: 0, code: 'timeout', message: `No answer in ${timeoutMs} ms.` });
        const msg = e instanceof Error ? e.message : String(e);
        return new errors_js_1.SatelitError({ status: 0, code: 'network_error', message: `Network error: ${msg}`, cause: e });
    }
}
exports.SatelitCore = SatelitCore;
