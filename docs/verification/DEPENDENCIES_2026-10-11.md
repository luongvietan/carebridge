# Dependency security verification — 11 October 2026

Initial `npm audit --omit=dev`: 5 affected package entries (2 high, 3 moderate). Final production audit after the fixes: **0 vulnerabilities**.

Updated locked production dependencies: `baseline-browser-mapping` 2.11.28, `brace-expansion` 1.1.21 / 2.1.7, `source-map-js` 1.2.2, and `uuid` 11.1.1. ExcelJS remains 4.4.0. Its only UUID use is `require('uuid').v4()` in conditional-formatting transforms; UUID 11.1.1 keeps CommonJS and includes the [security backport](https://github.com/uuidjs/uuid/releases/tag/v11.1.1).

The workspace-root UUID override did not apply through the workspace link on the installed npm. The same issue is described in [npm/cli #9659](https://github.com/npm/cli/issues/9659). The root also declares ExcelJS as a dev dependency to give the override a direct root edge; the workspace still declares its runtime dependency. `npm ls uuid` confirms the shared dependency resolves to 11.1.1 overridden. Retain this root edge until a clean-install check proves it can be removed.

Compatible `npm audit fix` also updated development dependencies in the lockfile. No forced major downgrade or `audit fix --force` was used. CI now runs `npm audit --omit=dev` after `npm ci` so production advisories fail the release checks.

Reproducibility check: copied the final root/workspace manifests and lockfile into a fresh ignored directory and ran `npm ci --ignore-scripts --no-fund`. Installation succeeded; `npm ls uuid` resolved 11.1.1 overridden and the clean tree's production audit reported zero vulnerabilities. Lifecycle scripts were deliberately skipped in this isolated dependency check; the actual application build and test suite are verified separately in the working checkout.

ExcelJS compatibility smoke: created an XLSX workbook with a data-bar conditional-formatting rule, wrote its 6,406-byte buffer, reloaded it and asserted the cell value survived. This exercises the spreadsheet export path after the UUID override.

A separate fresh `npm ci --omit=dev --ignore-scripts --no-fund` also succeeded (152 audited packages, zero vulnerabilities). ExcelJS remained available through the web workspace's runtime dependency and UUID resolved to 11.1.1 overridden. The override therefore survives omitting the root development dependency from the installed tree.

Full-tree audit still reports **7 high package entries**, all in development tooling's `braces` chain (`micromatch`, `fast-glob`, Next ESLint tooling, `deslop-js` and React Doctor). This represents a shared transitive advisory, not seven independent production vulnerabilities. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects braces through 3.0.3 and lists no patched release at review time.

Mitigation while awaiting an upstream patch: these tools execute only on trusted repository files/patterns during local/CI lint and analysis; do not expose glob patterns or arbitrary untrusted repositories to them as a service. `npm ls braces --omit=dev` is empty. This is a documented residual development risk, **not an assertion that the user has accepted it**. Reassess on dependency updates. Production audit success does not certify the application against all security issues.
