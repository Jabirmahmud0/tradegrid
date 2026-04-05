import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/*.spec.ts', '**/node_modules/**'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
});
