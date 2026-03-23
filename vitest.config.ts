import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/common/errors.ts',
        'src/common/logger.ts',
        'src/plugins/information-mediator.ts',
        'src/workflows/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    setupFiles: ['./test/setup.ts'],
  },
});
