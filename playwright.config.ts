import { defineConfig, devices } from "@playwright/test";

const preview = "http://127.0.0.1:4175";

export default defineConfig({
  testDir: "tests/browser",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: preview },
  webServer: {
    command: "npx astro preview --force --host 127.0.0.1 --port 4175",
    url: preview,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: /webgl/ },
    {
      name: "webgl-off",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: ["--disable-webgl", "--disable-gpu"] },
      },
      testMatch: /webgl/,
    },
  ],
});
