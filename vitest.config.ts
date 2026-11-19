import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const alias = {
  '@': fileURLToPath(new URL('./web/src', import.meta.url)),
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: 'server', environment: 'node', include: ['src/**/*.test.ts'] },
      },
      {
        plugins: [vue()],
        resolve: { alias },
        test: { name: 'web', environment: 'jsdom', include: ['web/src/**/*.test.ts'] },
      },
    ],
  },
});
