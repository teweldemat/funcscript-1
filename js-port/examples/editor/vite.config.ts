import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  resolve: {
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
      include: [/@tewelde\/walya/, /node_modules/]
    }
  }
});
