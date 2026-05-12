import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.vitest.ts', 'src/**/*.vitest.tsx'],
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, './src/shared/lib'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@ui': path.resolve(__dirname, './src/shared/ui'),
      '@types-api': path.resolve(__dirname, './src/api/types/api.types'),
      '@api': path.resolve(__dirname, './src/api'),
    },
  },
});
