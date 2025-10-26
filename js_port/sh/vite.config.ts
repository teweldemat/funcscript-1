import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'funcscript/parser': path.resolve(__dirname, '../fs_js/src/parser/FuncScriptParser')
    },
    dedupe: ['@codemirror/state', '@codemirror/view', '@codemirror/commands']
  },
  server: {
    port: 5174
  },
  optimizeDeps: {
    include: ['funcscript', 'funcscript/parser']
  },
  build: {
    commonjsOptions: {
      include: [/funcscript/, /node_modules/, /fs_js/]
    }
  }
});
