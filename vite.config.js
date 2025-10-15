import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    open: '/client-success-portal.html',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        portal: resolve(__dirname, 'client-success-portal.html'),
        demo: resolve(__dirname, 'demo.html')
      }
    }
  }
});
