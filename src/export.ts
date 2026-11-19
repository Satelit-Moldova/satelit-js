import type { CallOptions, Transport } from './core.js';
import { SatelitError } from './errors.js';

export type ExportProduct =
  | 'news'
  | 'news_events'
  | 'law'
  | 'places'
  | 'rates'
  | 'fuel'
  | 'tariffs'
  | 'indexes'
  | 'recipes'
  | 'prices'
  | 'tours'
  | 'flights'
  | 'rest'
  | 'estate'
  | 'power'
  | 'chain_shops'
  | (string & {});

/** The first line of an export. */
export interface ExportMeta {
  [key: string]: unknown;
}
/** The last line of an export: a file without it was cut. */
export interface ExportEnd {
  rows: number;
  complete: boolean;
  [key: string]: unknown;
}

export interface ExportRowsOptions extends CallOptions {
  /** Called with the `_meta` line before the first row. */
  onMeta?: (meta: ExportMeta) => void;
  /** Called with the `_end` line after the last row. */
  onEnd?: (end: ExportEnd) => void;
}

/**
 * Whole products as NDJSON (`GET /export/{product}`), Enterprise only (else 402 `plan_required`).
 * One export runs at a time per account (429 `export_running`).
 */
export class ExportApi {
  constructor(private readonly c: Transport) {}

  /** The raw NDJSON byte stream, to pipe into a file. */
  async stream(product: ExportProduct, opts?: CallOptions): Promise<ReadableStream<Uint8Array>> {
    const res = await this.c.raw(`/export/${encodeURIComponent(product)}`, undefined, { ...opts, accept: 'application/x-ndjson' });
    if (!res.body) throw new SatelitError({ status: res.status, code: 'bad_response', message: 'The export has no body.' });
    return res.body;
  }

  /**
   * The export's rows, parsed one line at a time (memory stays flat).
   * Throws `export_incomplete` if the stream ends without its `_end` line.
   */
  async *rows(
    product: ExportProduct,
    opts: ExportRowsOptions = {},
  ): AsyncGenerator<Record<string, unknown>, ExportEnd, undefined> {
    const { onMeta, onEnd, ...call } = opts;
    const body = await this.stream(product, call);
    let end: ExportEnd | null = null;
    for await (const line of lines(body)) {
      if (!line.trim()) continue;
      const row = JSON.parse(line) as Record<string, unknown>;
      if (row && typeof row === 'object' && '_meta' in row) {
        onMeta?.(row._meta as ExportMeta);
      } else if (row && typeof row === 'object' && '_end' in row) {
        end = row._end as ExportEnd;
        onEnd?.(end);
      } else {
        yield row;
      }
    }
    if (!end) throw new SatelitError({ status: 200, code: 'export_incomplete', message: 'The export ended without its `_end` line: the file was cut.' });
    return end;
  }
}

/** Splits a byte stream into UTF-8 lines. */
export async function* lines(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, undefined> {
  const reader = body.getReader();
  const dec = new TextDecoder('utf-8');
  let buf = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        yield buf.slice(0, i);
        buf = buf.slice(i + 1);
      }
    }
    buf += dec.decode();
    if (buf) yield buf;
  } finally {
    reader.releaseLock();
  }
}
