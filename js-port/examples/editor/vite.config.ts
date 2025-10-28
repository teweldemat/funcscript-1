import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    dedupe: ['@codemirror/state', '@codemirror/view', '@codemirror/commands']
  },
  server: {
    port: 5174,
    watch: {
      followSymlinks: true
    }
  },
  optimizeDeps: {
    include: ['@tewelde/funscscript', '@tewelde/funscscript/parser', '@tewelde/funscscript-editor'],
    force: true
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/, /funscscript-js\//, /funscscript-editor\//]
    }
  }
});
