import type { CallOptions, Transport } from './core.js';
export type ExportProduct = 'news' | 'news_events' | 'law' | 'places' | 'rates' | 'fuel' | 'tariffs' | 'indexes' | 'recipes' | 'prices' | 'tours' | 'flights' | 'rest' | 'estate' | 'power' | 'chain_shops' | (string & {});
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
export declare class ExportApi {
    private readonly c;
    constructor(c: Transport);
    /** The raw NDJSON byte stream, to pipe into a file. */
    stream(product: ExportProduct, opts?: CallOptions): Promise<ReadableStream<Uint8Array>>;
    /**
     * The export's rows, parsed one line at a time (memory stays flat).
     * Throws `export_incomplete` if the stream ends without its `_end` line.
     */
    rows(product: ExportProduct, opts?: ExportRowsOptions): AsyncGenerator<Record<string, unknown>, ExportEnd, undefined>;
}
/** Splits a byte stream into UTF-8 lines. */
export declare function lines(body: ReadableStream<Uint8Array>): AsyncGenerator<string, void, undefined>;
