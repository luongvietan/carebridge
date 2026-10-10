# Follow-up fixes from rendered website observations

11 October 2026. These changes address issues reported by the parent agent during its brief successful localhost browser access. This implementation agent did not operate the browser.

## Findings and source corrections

- The home page's main landmark began at Services, leaving the hero heading, statistics and About section outside the main region. Home now has one focusable `main-content` wrapping all page content. Navigation and footer remain outside it.
- FAQ, About and Services pages likewise placed their hero outside main. Their main landmarks now include the hero. Contact now includes its page hero within main while retaining its original width/padding container around the contact content.
- The main target has a scroll margin for the sticky navigation so skip navigation does not place the target under the header.
- The Portuguese FAQ sidebar displayed English help heading/body/contact text. `FaqList` now receives the existing visitor locale through `HomeFaqSection` and the FAQ route. English remains the default.
- The Portuguese home compliance image badge displayed “Compliance status”. `ComplianceShowcase` now receives the existing visitor locale and forwards a localized status label to its illustration card. This change does not modify content supplied by its caller.

The compact compliance-card layout is owned by the controls agent; its class changes are preserved separately from these locale changes.

## Checks and scope limits

Targeted ESLint and TypeScript passed. Two marketing regression tests passed, covering the Portuguese FAQ sidebar and working expand/collapse behavior, and the localized compliance label. These were also included in the 22-test account-compatibility/marketing verification run recorded in `country-compatibility-fix.md`.

Final parent-agent checks passed: full lint, **71 files / 468 Vitest tests**, **3 readiness policy tests**, and production build. React Doctor remains **82/100**, **7 warnings**, no errors. Translation-scan timeouts under concurrent heavy checks resolved on an isolated full-suite rerun without changing timeout settings. Rendered/browser rechecks remain blocked by the URL policy.

The parent agent reported successful menu keyboard behavior: focus entered the first mobile-menu link and Escape returned it to the toggle. That observation is not a full screen-reader/device certification. Browser access was subsequently blocked again by the URL security policy; final rendered rechecks remain pending. No booking or message was created.
