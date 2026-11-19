import type { RateInfo } from './core.js';

/** Error codes the API documents (https://developer.satelit.md/en/errors/), plus the SDK's own. */
export type ErrorCode =
  | 'auth_required'
  | 'key_invalid'
  | 'plan_required'
  | 'not_available'
  | 'account_suspended'
  | 'not_found'
  | 'invalid'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'export_running'
  | 'busy'
  | 'server_error'
  // the SDK's own:
  | 'timeout'
  | 'network_error'
  | 'bad_response'
  | 'export_incomplete'
  | (string & {});

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
export class SatelitError extends Error {
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

  constructor(init: SatelitErrorInit) {
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
  static async fromResponse(res: Response, rate: RateInfo): Promise<SatelitError> {
    const text = await res.text();
    let e: Record<string, unknown> | undefined;
    try {
      const body = JSON.parse(text) as { error?: Record<string, unknown> };
      e = body && typeof body.error === 'object' && body.error ? body.error : undefined;
    } catch {
      e = undefined;
    }
    const str = (v: unknown) => (typeof v === 'string' ? v : null);
    return new SatelitError({
      status: res.status,
      code: str(e?.code) ?? `http_${res.status}`,
      message: str(e?.message) ?? `HTTP ${res.status}`,
      docs: str(e?.docs),
      fields: Array.isArray(e?.fields) ? (e!.fields as unknown[]).map(String) : null,
      choose: str(e?.choose),
      retryAfter: rate.retryAfter,
      rate,
    });
  }
}
