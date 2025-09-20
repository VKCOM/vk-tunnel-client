import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['./test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**'],
    },
  },
});
