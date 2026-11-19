"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SatelitError = void 0;
/**
 * Every failure of a call. `status` is 0 for a timeout or a network error.
 *
 * ```ts
 * try { await satelit.rates.list() } catch (e) {
 *   if (e instanceof SatelitError && e.code === 'quota_exceeded') …
 * }
 * ```
 */
class SatelitError extends Error {
    status;
    code;
    /** Link to the error's page in the docs. */
    docs;
    /** For 422 `invalid`: the parameters that were wrong. */
    fields;
    /** Seconds to wait (`Retry-After`), on 429 and 503. */
    retryAfter;
    /** For 402 `plan_required` without a plan: the pricing page. */
    choose;
    /** Credit and rate headers of the failed answer. */
    rate;
    constructor(init) {
        super(init.message, init.cause !== undefined ? { cause: init.cause } : undefined);
        this.name = 'SatelitError';
        this.status = init.status;
        this.code = init.code;
        this.docs = init.docs ?? null;
        this.fields = init.fields ?? null;
        this.retryAfter = init.retryAfter ?? init.rate?.retryAfter ?? null;
        this.choose = init.choose ?? null;
        this.rate = init.rate ?? null;
    }
    /** Builds the error from a non-2xx answer (`{"error": {code, message, docs, fields?, choose?}}`). */
    static async fromResponse(res, rate) {
        const text = await res.text();
        let e;
        try {
            const body = JSON.parse(text);
            e = body && typeof body.error === 'object' && body.error ? body.error : undefined;
        }
        catch {
            e = undefined;
        }
        const str = (v) => (typeof v === 'string' ? v : null);
        return new SatelitError({
            status: res.status,
            code: str(e?.code) ?? `http_${res.status}`,
            message: str(e?.message) ?? `HTTP ${res.status}`,
            docs: str(e?.docs),
            fields: Array.isArray(e?.fields) ? e.fields.map(String) : null,
            choose: str(e?.choose),
            retryAfter: rate.retryAfter,
            rate,
        });
    }
}
exports.SatelitError = SatelitError;
