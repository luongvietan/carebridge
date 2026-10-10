# CareBridge Connect interaction patterns

Established from the implemented website during the UI/UX fixes on 10 October 2026. These patterns describe current behavior; they do not certify WCAG compliance or establish a committed accessibility tier.

## Navigation and language

- The first keyboard link skips to `main-content`. Each page or its auth shell owns one focusable main landmark.
- Marketing and role mobile menus are disclosures, with a controlled region, visible expanded state, Escape dismissal and focus return. They do not trap focus as a modal would.
- Portal breadcrumbs return to the dashboard and relevant task area. Portal client components use the persisted account locale, even when the marketing market differs.

## Dialogs and controls

- Confirmation and prompt dialogs use the shared native `Modal`, with an accessible title, localized close control, backdrop, Escape dismissal and trigger focus restoration. The browser provides modal containment.
- `Select` keeps focus on the combobox, announces its active option through `aria-activedescendant`, skips disabled options, supports arrow/Home/End/Enter/Escape keys, and uses a native validation proxy for required fields.
- Select lists inside a modal remain within its native dialog. Date popovers are nonmodal controls and return focus to the trigger on dismissal.
- Required native fields show an asterisk. Programmatic required semantics remain on the control; decorative markers do not duplicate accessible names.

## Forms and recovery

- Pending forms expose `aria-busy`; action errors use alert regions and success feedback uses status regions. Native field validation stays available.
- Booking creation first displays a summary without a mutation. Editing any submitted field invalidates that review. Only the confirmation submits the booking; successful creation presents its durable result and a bookings link.
- Booking times explicitly use Europe/London, including daylight saving. The summary repeats start/end and location.
- Destructive and financial state changes use contextual confirmation. A rejected or thrown action must release pending state and expose recovery feedback.

## Loading, tables and visual treatment

- Route loading provides a localized status and decorative skeleton. Route errors provide a retry action and contact link while shared navigation remains available.
- Tables use a focusable scroll region with a localized instruction, preserving native table markup. Empty booking lists link to the next relevant action.
- Colors use shared Tailwind theme tokens. Small metadata uses the darker muted token. Keyboard focus remains visible, and reduced motion disables decorative animation/transition durations.
- Marketing page reveals animate opacity rather than visibility, preserving content in the accessibility tree. A focus-within fallback reveals a section immediately when keyboard focus enters it; reduced motion shows content immediately.
- Legal documents include an index linked to sections and a recorded text-revision date. Draft notices remain distinct from approval.

## Regression coverage

Control tests cover modal focus restoration, combobox semantics and required validation, controls in dialogs, date focus/localization, menu Escape handling and assistant focus/log behavior. Booking tests cover mutation-free review, invalidation after edits, final payload timing and success. Additional tests cover route recovery, table regions, translation coverage and account locale isolation.
