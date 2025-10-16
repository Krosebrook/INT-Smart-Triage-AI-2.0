import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        demo: './public/demo.html',
      },
    },
  },
});
