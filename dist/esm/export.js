import { SatelitError } from './errors.js';
/**
 * Whole products as NDJSON (`GET /export/{product}`), Enterprise only (else 402 `plan_required`).
 * One export runs at a time per account (429 `export_running`).
 */
export class ExportApi {
    c;
    constructor(c) {
        this.c = c;
    }
    /** The raw NDJSON byte stream, to pipe into a file. */
    async stream(product, opts) {
        const res = await this.c.raw(`/export/${encodeURIComponent(product)}`, undefined, { ...opts, accept: 'application/x-ndjson' });
        if (!res.body)
            throw new SatelitError({ status: res.status, code: 'bad_response', message: 'The export has no body.' });
        return res.body;
    }
    /**
     * The export's rows, parsed one line at a time (memory stays flat).
     * Throws `export_incomplete` if the stream ends without its `_end` line.
     */
    async *rows(product, opts = {}) {
        const { onMeta, onEnd, ...call } = opts;
        const body = await this.stream(product, call);
        let end = null;
        for await (const line of lines(body)) {
            if (!line.trim())
                continue;
            const row = JSON.parse(line);
            if (row && typeof row === 'object' && '_meta' in row) {
                onMeta?.(row._meta);
            }
            else if (row && typeof row === 'object' && '_end' in row) {
                end = row._end;
                onEnd?.(end);
            }
            else {
                yield row;
            }
        }
        if (!end)
            throw new SatelitError({ status: 200, code: 'export_incomplete', message: 'The export ended without its `_end` line: the file was cut.' });
        return end;
    }
}
/** Splits a byte stream into UTF-8 lines. */
export async function* lines(body) {
    const reader = body.getReader();
    const dec = new TextDecoder('utf-8');
    let buf = '';
    try {
        for (;;) {
            const { value, done } = await reader.read();
            if (done)
                break;
            buf += dec.decode(value, { stream: true });
            let i;
            while ((i = buf.indexOf('\n')) >= 0) {
                yield buf.slice(0, i);
                buf = buf.slice(i + 1);
            }
        }
        buf += dec.decode();
        if (buf)
            yield buf;
    }
    finally {
        reader.releaseLock();
    }
}
