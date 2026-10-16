import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    disableConsoleIntercept: true,
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
})
