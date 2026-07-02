import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4517',
    colorScheme: 'light',
  },
  webServer: {
    command: 'npm run dev',
    port: 4517,
    env: { PORT: '4517' },
    reuseExistingServer: !process.env.CI,
  },
})
