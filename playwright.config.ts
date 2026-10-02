import { defineConfig, devices } from '@playwright/test';

// Por padrão usa o Edge/Chrome já instalado (sem baixar navegador). PW_CHANNEL=chromium para o do Playwright.
const channel = process.env.PW_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome');

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 20_000,
  use: {
    baseURL: 'http://localhost:4173/',
    ...devices['Desktop Chrome'],
    channel,
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
