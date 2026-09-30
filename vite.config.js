import { resolve } from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        display: resolve(__dirname, 'display.html')
      }
    }
  },
  plugins: [
    {
      name: 'copy-static-dirs',
      closeBundle() {
        if (fs.existsSync('js')) {
          fs.cpSync('js', 'dist/js', { recursive: true });
        }
        if (fs.existsSync('assets')) {
          fs.cpSync('assets', 'dist/assets', { recursive: true });
        }
      }
    }
  ]
});
