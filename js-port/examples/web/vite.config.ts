import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'funcscript/parser': path.resolve(__dirname, '../fs-js/src/parser/func-script-parser')
    }
  },
  server: {
    port: 5173
  },
  optimizeDeps: {
    include: ['funcscript', 'funcscript/parser']
  },
  build: {
    commonjsOptions: {
      include: [/funcscript/, /node_modules/, /fs-js/]
    }
  }
});
