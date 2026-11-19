import type { RateInfo } from './core.js';
/** Error codes the API documents (https://developer.satelit.md/en/errors/), plus the SDK's own. */
export type ErrorCode = 'auth_required' | 'key_invalid' | 'plan_required' | 'not_available' | 'account_suspended' | 'not_found' | 'invalid' | 'rate_limited' | 'quota_exceeded' | 'export_running' | 'busy' | 'server_error' | 'timeout' | 'network_error' | 'bad_response' | 'export_incomplete' | (string & {});
export interface SatelitErrorInit {
    status: number;
    code: ErrorCode;
    message: string;
    docs?: string | null;
    fields?: string[] | null;
    retryAfter?: number | null;
    choose?: string | null;
    rate?: RateInfo | null;
    cause?: unknown;
}
/**
 * Every failure of a call. `status` is 0 for a timeout or a network error.
 *
 * ```ts
 * try { await satelit.rates.list() } catch (e) {
 *   if (e instanceof SatelitError && e.code === 'quota_exceeded') …
 * }
 * ```
 */
export declare class SatelitError extends Error {
    readonly status: number;
    readonly code: ErrorCode;
    /** Link to the error's page in the docs. */
    readonly docs: string | null;
    /** For 422 `invalid`: the parameters that were wrong. */
    readonly fields: string[] | null;
    /** Seconds to wait (`Retry-After`), on 429 and 503. */
    readonly retryAfter: number | null;
    /** For 402 `plan_required` without a plan: the pricing page. */
    readonly choose: string | null;
    /** Credit and rate headers of the failed answer. */
    readonly rate: RateInfo | null;
    constructor(init: SatelitErrorInit);
    /** Builds the error from a non-2xx answer (`{"error": {code, message, docs, fields?, choose?}}`). */
    static fromResponse(res: Response, rate: RateInfo): Promise<SatelitError>;
}
