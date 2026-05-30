import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // Live data still flows through the existing Node allowlist proxy on 8080.
            '/proxy': 'http://localhost:8080',
        },
    },
    build: { outDir: 'dist', emptyOutDir: true },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
});
