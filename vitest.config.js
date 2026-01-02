import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true, // allow using 'describe', 'it', 'expect' without import
    environment: 'node',
    setupFiles: ['./tests/vitest.setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
