import { defineConfig } from 'vitest/config';
import type { PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn, type ChildProcess } from 'node:child_process';
import { createConnection } from 'node:net';

// Dev-only: boot the Node allowlist proxy (server.js on :8080) alongside Vite so
// `/proxy` live-data fetches work from a single `npm run dev`. Skips spawning if
// something is already listening on 8080 (e.g. a manually started server).
function proxyServerPlugin(): PluginOption {
  let child: ChildProcess | undefined;
  const portInUse = () =>
    new Promise<boolean>((resolve) => {
      const sock = createConnection({ port: 8080, host: 'localhost' })
        .once('connect', () => { sock.destroy(); resolve(true); })
        .once('error', () => resolve(false));
    });

  return {
    name: 'erep-proxy-server',
    apply: 'serve',
    async configureServer(server) {
      if (await portInUse()) {
        server.config.logger.info('[proxy] :8080 already running — reusing it');
        return;
      }
      child = spawn('node', ['server.js'], { stdio: 'inherit' });
      const kill = () => { child?.kill(); child = undefined; };
      server.httpServer?.once('close', kill);
      process.once('SIGINT', () => { kill(); process.exit(); });
      process.once('SIGTERM', () => { kill(); process.exit(); });
    },
  };
}

export default defineConfig({
  plugins: [react(), proxyServerPlugin()],
  server: {
    port: 5173,
    proxy: {
      // Live data still flows through the existing Node allowlist proxy on 8080.
      '/proxy': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Only run the new TS suites; the legacy node:test file (holdingsCalc.test.mjs)
    // stays runnable via `node --test` and is removed at cutover.
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'server/**/*.test.js'],
  },
});
