import { defineConfig, devices } from "@playwright/test";

/** Local Supabase defaults — E2E always targets the local stack, not hosted `.env.local`. */
const LOCAL = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  SUPABASE_SERVICE_ROLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
  STRIPE_WEBHOOK_SECRET: "whsec_test_carebridge",
  /** Dummy key so the Stripe SDK initialises (constructEvent does not make network calls). */
  STRIPE_SECRET_KEY: "sk_test_carebridge_e2e",
} as const;

const e2eEnv = {
  ...LOCAL,
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100",
  RESEND_API_KEY: "",
  ANTHROPIC_API_KEY: "",
  PAYOUT_ENC_KEY: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  CRON_SECRET: "carebridge-local-e2e-only",
  // Force the private-preview gate OFF for e2e, overriding any value the dev
  // server would otherwise inherit from a hosted `.env.local`.
  PRODUCTION_GATE_ENABLED: "false",
};

// Ensure test helpers (service client) use the same project as the dev server.
for (const [key, value] of Object.entries(e2eEnv)) {
  process.env[key] = value;
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  // Cold Next.js compilation and server actions may outlast Playwright's 5s default.
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // Tests share one local database, so run them serially to avoid cross-file
  // races on shared rows (rate cards, bookings, …).
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3100" },
  webServer: {
    // Test the release runtime; dev hot reload can interrupt action/OTP navigation.
    // Build receives the same local-only environment as the server and helpers.
    command: "npx next build --webpack && npx next start -H 127.0.0.1 -p 3100",
    url: "http://127.0.0.1:3100",
    // Must not reuse a server built or started with hosted credentials.
    reuseExistingServer: false,
    timeout: 300_000,
    env: e2eEnv,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
    { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
    { name: "Mobile Chrome", use: { ...devices["Pixel 7"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
    { name: "Mobile Safari", use: { ...devices["iPhone 14"] }, testMatch: /matrix[\\/].*\.spec\.ts/ },
  ],
});
