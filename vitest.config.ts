/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Look for test files in the packages directory and the new tests/ folders
    include: [
      'packages/**/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    // Only run tests for files that actually contain tests
    exclude: ['**/node_modules/**', '**/dist/**'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/src/**/*.{js,ts}'],
      exclude: [
        'packages/**/src/types/**',
        'packages/**/dist/**',
        'packages/**/node_modules/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 60,
          functions: 80,
          lines: 70,
        },
        'packages/**/src/loaders/**': {
          statements: 75,
          branches: 65,
          functions: 85,
          lines: 75,
        },
        'packages/**/src/utils/**': {
          statements: 50,
          branches: 40,
          functions: 60,
          lines: 50,
        },
      },
    },
  },
});
