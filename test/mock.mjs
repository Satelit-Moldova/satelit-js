// A scripted fetch for the offline tests: answers in order, records every request.
export function mockFetch(answers) {
  const calls = [];
  const queue = [...answers];
  const fn = async (url, init = {}) => {
    calls.push({ url: new URL(url), headers: init.headers || {}, signal: init.signal });
    const next = queue.length > 1 ? queue.shift() : queue[0];
    if (typeof next === 'function') return next(url, init);
    return reply(next);
  };
  fn.calls = calls;
  return fn;
}

/** {status, body, headers} -> Response. `body` objects become JSON. */
export function reply({ status = 200, body = { data: null, meta: meta() }, headers = {} } = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, { status, headers: { 'content-type': 'application/json', ...headers } });
}

export function meta(extra = {}) {
  return { credits: 1, updated_at: '2026-11-19T10:00:00+02:00', sources: [], attribution: null, ...extra };
}

export const RATE_HEADERS = {
  'x-ratelimit-limit': '600',
  'x-ratelimit-remaining': '599',
  'x-ratelimit-reset': '42',
  'x-credits-cost': '1',
  'x-credits-limit': '300000',
  'x-credits-remaining': '299000',
  'x-credits-reset': '2026-12-19T16:41:51+02:00',
};

export function apiError(status, code, extra = {}, headers = {}) {
  return {
    status,
    headers,
    body: { error: { code, message: `msg ${code}`, docs: `https://developer.satelit.md/en/errors/#${code}`, ...extra } },
  };
}

/** A fetch that never answers until its signal aborts. */
export function hangingFetch() {
  return (_url, init) =>
    new Promise((_, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason ?? new Error('aborted')));
    });
}

/** A Response whose body arrives in the given chunks (strings or bytes). */
export function chunked(chunks, status = 200) {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(ctrl) {
      for (const c of chunks) ctrl.enqueue(typeof c === 'string' ? enc.encode(c) : c);
      ctrl.close();
    },
  });
  return new Response(stream, { status, headers: { 'content-type': 'application/x-ndjson' } });
}
