import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    env: {
      DATABASE_URL: 'file:./test.db',
    },
  },
});
