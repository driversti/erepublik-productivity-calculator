// ESM module (package.json has "type": "module").
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;
// Serve the Vite production build (run `npm run build` first). Falls back to the
// repo root for assets that live outside dist (e.g. styles.css) so existing
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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
            res.writeHead(200, { 'Content-Type': contentType });
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
