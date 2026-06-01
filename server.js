// ESM module (package.json has "type": "module").
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildUniverse } from './server/buildUniverse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Country list (id -> {id,name,permalink}) for the Society-page universe builder.
// Read via fs (not a JSON import) so it works on any Node version and resolves
// relative to this file in both dev (repo root) and the Docker image (/app).
const countries = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/countries.json'), 'utf8'));

const PORT = Number(process.env.PORT) || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const UNIVERSE_FILE = path.join(DATA_DIR, 'universe.json');
// The optimizer scans the whole world, so we always enumerate ALL 74 countries.
// One shared 30-min cache keeps the GCP IP at ~74 anonymous fetches per window.
const UNIVERSE_TTL_MS = 30 * 60 * 1000;
let universeBuilding = null; // in-flight guard: collapse concurrent rebuilds into one

// Serve the Vite production build (run `npm run build` first). Falls back to the
// repo root if dist is absent, and serves static assets referenced by the build.
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

function fetchErepText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    } }, (r) => {
      if (r.statusCode !== 200) { r.resume(); reject(new Error(`HTTP ${r.statusCode}`)); return; }
      let body = ''; r.setEncoding('utf8');
      r.on('data', (c) => { body += c; });
      r.on('end', () => resolve(body));
    }).on('error', reject);
  });
}

async function getUniverse() {
  try {
    const stat = await fs.promises.stat(UNIVERSE_FILE);
    if (Date.now() - stat.mtimeMs < UNIVERSE_TTL_MS) {
      return JSON.parse(await fs.promises.readFile(UNIVERSE_FILE, 'utf8'));
    }
  } catch { /* missing/unreadable — rebuild */ }
  if (!universeBuilding) {
    universeBuilding = (async () => {
      const list = Object.values(countries);
      const regions = await buildUniverse(fetchErepText, list);
      const data = { fetchedAt: new Date().toISOString(), regions };
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${UNIVERSE_FILE}.tmp`;
      await fs.promises.writeFile(tmp, JSON.stringify(data));
      await fs.promises.rename(tmp, UNIVERSE_FILE);
      return data;
    })().finally(() => { universeBuilding = null; });
  }
  return universeBuilding;
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

    if (pathname === '/api/universe' && req.method === 'GET') {
      getUniverse()
        .then((data) => { sendJson(res, 200, data); })
        .catch(() => { sendJson(res, 502, { error: 'Could not build region universe' }); });
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
