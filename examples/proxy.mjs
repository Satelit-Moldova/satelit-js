// A minimal proxy that keeps the key on the server and caches the answer 3 h.   node examples/proxy.mjs
// Then: curl http://127.0.0.1:8080/rates   (1 credit per fresh fetch, at most one every 3 h)
import { createServer } from 'node:http';
import { Satelit } from '@satelit-moldova/sdk';

const satelit = new Satelit(); // SATELIT_API_KEY from the environment
let copy = null;

createServer(async (req, res) => {
  if (req.url !== '/rates') return res.writeHead(404).end();
  if (!copy || Date.now() - copy.at > 3 * 3600_000) {
    try {
      const { data, meta } = await satelit.rates.list();
      copy = { at: Date.now(), body: JSON.stringify({ data, attribution: meta.attribution }) };
    } catch (e) {
      console.error(`rates: ${e.code ?? e.message}`); // short line; keep serving the old copy
      if (!copy) return res.writeHead(502).end();
    }
  }
  res.writeHead(200, { 'content-type': 'application/json' }).end(copy.body);
}).listen(Number(process.env.PORT) || 8080, '127.0.0.1');
