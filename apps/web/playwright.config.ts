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
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? LOCAL.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? LOCAL.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? LOCAL.SUPABASE_SERVICE_ROLE_KEY,
  STRIPE_WEBHOOK_SECRET:
    process.env.STRIPE_WEBHOOK_SECRET ?? LOCAL.STRIPE_WEBHOOK_SECRET,
  STRIPE_SECRET_KEY:
    process.env.STRIPE_SECRET_KEY ?? LOCAL.STRIPE_SECRET_KEY,
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
  fullyParallel: false,
  // Tests share one local database, so run them serially to avoid cross-file
  // races on shared rows (rate cards, bookings, …).
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:3000" },
  webServer: {
    command: "npx next dev -H 127.0.0.1 -p 3000",
    url: "http://127.0.0.1:3000",
    // Must not reuse a dev server started with hosted `.env.local` credentials.
    reuseExistingServer: false,
    timeout: 180_000,
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
