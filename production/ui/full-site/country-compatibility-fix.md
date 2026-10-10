# Account-country schema compatibility fix

11 October 2026.

## Problem

The deployed database's `users` table does not yet expose `country_code`. Its snapshot query returns PostgreSQL `42703` (“column users.country_code does not exist”), causing account-locale lookups used by admin and portal rendering to fail. The missing column was confirmed by a read-only schema query; this document does not claim a successful post-fix admin render.

## Change

`apps/web/src/lib/accounts/market-server.ts` now recognizes only the known missing signup-country column error:

- PostgreSQL `42703` with an exact missing `users.country_code` message, including quoted identifier form; or
- PostgREST `PGRST204` with the exact schema-cache message naming the `country_code` column of `users`.

For that error only, the function retries a `users` read selecting `account_type`. It then uses the existing persisted professional/organisation profile country, or the existing GB legacy fallback when there is no applicable country profile. A valid signup snapshot still takes precedence whenever available.

No database migration, auth mutation or remote data change was made. Signed-in market selection never falls back to mutable auth metadata or the visitor's marketing cookie. Other account-read errors, failed compatibility retries and profile-read errors still reject instead of guessing.

This is a narrow read-compatibility change, not a substitute for completing the existing signup-country migration. Until that column is available, legacy private-client accounts without a persisted country retain the application's existing GB fallback.

## Verification

New tests cover pre-migration PT professional and GB organisation accounts, private-client GB fallback despite PT metadata/cookie, exact PostgREST schema-cache compatibility, snapshot precedence, unrelated errors without retry, retry errors and profile failures. Existing account-journey tests remain included. Marketing locale regressions complete the interrupted rendered follow-up.

Targeted verification passed: **3 files, 22 tests** (10 new compatibility tests, 10 existing journey tests and 2 marketing locale regressions), TypeScript and ESLint for changed account/marketing sources and tests. Parent-agent full lint/test/build checks and rendered admin verification are separate. Browser rechecks are currently blocked by the browser URL security policy; no successful admin re-render is claimed.

## Final validation

The parent agent completed full lint, **71 test files / 468 Vitest tests**, **3 readiness policy tests**, and the production build successfully. The first test run overlapped heavy checks and hit the 5000ms timeout in two translation scans; the isolated rerun passed without increasing timeouts. The typed User test fixture was corrected before the successful production build. React Doctor remains **82/100**, **7 warnings**, no errors. Browser/admin rechecks remain blocked by the URL policy.
