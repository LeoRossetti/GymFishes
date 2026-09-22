import { defineConfig, devices } from '@playwright/test'

// Node 24 reads .env.local natively. E2E_EMAIL / E2E_PASSWORD carry no VITE_ prefix,
// so Vite never bundles them.
try {
  process.loadEnvFile('.env.local')
} catch {
  // no .env.local (CI): the spec skips itself
}

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: { ...devices['iPhone 14'], baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
})
