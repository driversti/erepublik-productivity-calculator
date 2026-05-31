// ESM module (package.json has "type": "module").
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trimMapData } from './server/trimMapData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const REGIONS_FILE = path.join(DATA_DIR, 'regions.json');
const MAP_DATA_URL =
  'https://www.erepublik.com/en/main/map-data?updated_at=2007-01-01T00%3A00%3A00-08%3A00';
const REFRESH_COOLDOWN_MS = 10 * 60 * 1000; // one successful refresh / 10 min
let lastRefreshOk = 0;

// Serve the Vite production build (run `npm run build` first). Falls back to the
// repo root for assets that live outside dist (e.g. travelData.js) so existing
// references keep working, and serves from the root entirely if dist is absent.
const DIST_DIR = path.join(__dirname, "dist");
const PUBLIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : __dirname;

// Proxy targets are matched against this exact-hostname allowlist (https only).
const ALLOWED_PROXY_HOSTS = new Set([
    'www.erepublik.com',
    'service.erepublik.tools'
]);

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

// POST /api/regions/refresh — fetch map-data from eRepublik with the caller's
// erpk, trim, and persist. The erpk is used for the single outbound request and
// never stored. Debounced to one successful refresh per cooldown window.
async function handleRefresh(req, res) {
  const now = Date.now();
  if (now - lastRefreshOk < REFRESH_COOLDOWN_MS) {
    const retryIn = Math.ceil((REFRESH_COOLDOWN_MS - (now - lastRefreshOk)) / 1000);
    sendJson(res, 429, { error: `Recently refreshed — try again in ${retryIn}s` });
    return;
  }
  let body = '';
  let aborted = false;
  req.on('data', (chunk) => {
    if (aborted) return;
    body += chunk;
    if (body.length > 1e6) {
      aborted = true;
      sendJson(res, 413, { error: 'Request body too large' });
      req.destroy();
    }
  });
  req.on('end', async () => {
    if (aborted) return;
    let erpk;
    try {
      erpk = JSON.parse(body).erpk;
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }
    if (!erpk || typeof erpk !== 'string') {
      sendJson(res, 400, { error: 'Missing erpk' });
      return;
    }
    if (/[\r\n]/.test(erpk) || erpk.length > 4096) {
      sendJson(res, 400, { error: 'Invalid erpk' });
      return;
    }
    try {
      const mapRes = await fetch(MAP_DATA_URL, {
        redirect: 'manual', // a 302 means the session was rejected — don't follow it
        headers: {
          Cookie: `erpk=${erpk}`,
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36',
          Referer: 'https://www.erepublik.com/en/military/campaigns',
        },
      });
      if (mapRes.status !== 200) {
        sendJson(res, 401, { error: 'eRepublik rejected the session (expired or invalid erpk)' });
        return;
      }
      const raw = await mapRes.json();
      const dataset = trimMapData(raw, new Date().toISOString().slice(0, 10));
      const tmp = `${REGIONS_FILE}.tmp`;
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      await fs.promises.writeFile(tmp, JSON.stringify(dataset));
      await fs.promises.rename(tmp, REGIONS_FILE); // atomic replace
      lastRefreshOk = Date.now();
      sendJson(res, 200, { ...dataset, count: dataset.regions.length });
    } catch (err) {
      fs.promises.unlink(`${REGIONS_FILE}.tmp`).catch(() => {}); // best-effort cleanup
      console.error('Refresh failed:', err.message);
      sendJson(res, 502, { error: 'Could not fetch map-data from eRepublik' });
    }
  });
}

const server = http.createServer((req, res) => {
    // Use WHATWG URL API — no legacy url.parse()
    let reqUrl;
    try {
        reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
        return;
    }

    const pathname = reqUrl.pathname;

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Proxy endpoint
    if (pathname === '/proxy') {
        const targetUrl = reqUrl.searchParams.get('url');
        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing URL parameter');
            return;
        }

        // Security check: parse the URL and match the host against an exact
        // allowlist over https — prefix matching would let look-alike hosts
        // (e.g. www.erepublik.com.evil.test) or userinfo tricks slip through.
        let parsedTarget;
        try {
            parsedTarget = new URL(targetUrl);
        } catch (err) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Invalid target URL');
            return;
        }

        if (parsedTarget.protocol !== 'https:' || !ALLOWED_PROXY_HOSTS.has(parsedTarget.hostname)) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Forbidden target URL');
            return;
        }

        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
            'Accept-Language': 'en-GB,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        };

        https.get(parsedTarget, { headers }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': proxyRes.headers['content-type'] });
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('Proxy request error:', err.message);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Proxy error: ' + err.message);
            }
        });
        return;
    }

    // Serve the stored region dataset (refreshed from eRepublik), if any.
    if (pathname === '/api/regions' && req.method === 'GET') {
        fs.readFile(REGIONS_FILE, (err, content) => {
            if (err) {
                res.writeHead(204); // no stored data yet — client uses the bundled seed
                res.end();
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
            res.end(content);
        });
        return;
    }

    if (pathname === '/api/regions/refresh' && req.method === 'POST') {
        handleRefresh(req, res);
        return;
    }

    // Serve static files. Decode first so percent-encoded traversal
    // (e.g. %2e%2e) is normalized before the containment check.
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
        return;
    }

    const filePath = path.join(PUBLIC_DIR, decodedPath === '/' ? 'index.html' : decodedPath);

    // Prevent directory traversal: the resolved path must stay strictly
    // inside PUBLIC_DIR. A path.relative result that escapes upward ('..')
    // or is absolute means the request reached outside the served root.
    const relative = path.relative(PUBLIC_DIR, filePath);
    if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error: ' + err.code);
            }
        } else {
            // HTML must never be cached: it references content-hashed asset
            // filenames that change every build. A stale cached index.html would
            // point at a deleted JS bundle (404) and the app would break. Hashed
            // assets under /assets are safe to cache long-term.
            const isHtml = extname === '.html' || decodedPath === '/';
            const cacheControl = isHtml
                ? 'no-cache, no-store, must-revalidate'
                : (decodedPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
            res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl });
            res.end(content, 'utf-8');
        }
    });
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
});

// Prevent silent crashes from unhandled errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});

server.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}/`);
});
