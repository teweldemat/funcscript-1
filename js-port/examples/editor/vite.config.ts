import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@tewelde/walya/parser': path.resolve(__dirname, '../../walya-js/src/parser/walya-parser')
    },
    dedupe: ['@codemirror/state', '@codemirror/view', '@codemirror/commands']
  },
  server: {
    port: 5174
  },
  optimizeDeps: {
    include: ['@tewelde/walya', '@tewelde/walya/parser']
  },
  build: {
    commonjsOptions: {
      include: [/@tewelde\/walya/, /node_modules/, /walya-js/]
    }
  }
});
