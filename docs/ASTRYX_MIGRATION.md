# Astryx migration plan

Sona will adopt React 19 and Astryx progressively. The reading, synchronization, import, and narration engines remain operational throughout the migration; UI regions move only when their existing behavior is covered by tests.

## Success principles

- Every phase leaves the application deployable.
- Existing library data and browser storage remain compatible.
- Audio playback, cloud sync, importing, bookmarks, and queue behavior cannot regress.
- New React surfaces use Astryx components and tokens rather than recreating the design system in local CSS.
- Accessibility and responsive behavior are acceptance criteria, not later cleanup.
- Each completed phase receives a SemVer release and changelog entry.

## Phase 1 — Foundation and compatibility shell

Status: **complete**

Goals:

- Install React 19, Astryx Core, the neutral theme, StyleX, and the Astryx CLI.
- Initialize the official Astryx project guidance.
- Mount the existing application inside a React `Theme` boundary.
- Bundle Astryx reset, component, font, and theme styles with the existing Worker build.
- Keep all existing UI behavior and tests passing.
- Add a migration smoke test and run `astryx doctor` against the source.

Exit criteria:

- The production bundle contains React and Astryx.
- The legacy application renders inside the Astryx theme boundary without functional changes.
- The full automated suite passes.

## Phase 2 — Application frame and navigation

Status: **complete**

Goals:

- Replace the desktop sidebar and mobile navigation with `AppShell`, `SideNav`, and `MobileNav`.
- Move view selection into React state while preserving existing routes and actions.
- Establish responsive region budgets for library, player, queue, and settings.

Exit criteria:

- Navigation is keyboard accessible and responsive.
- No duplicated `<main>` landmarks or focus traps.
- All existing navigation flows pass automated tests.

## Phase 3 — Library and content intake

Status: **complete in the React/Astryx shell**

Goals:

- Migrate the library to Astryx `List`, `Item`, `Section`, `Heading`, and `Text` primitives.
- Migrate search, filters, empty states, article actions, and import forms.
- Preserve article artwork and Sona’s quiet visual identity through a custom Astryx theme.
- Route React and the existing engines through an immutable `useSyncExternalStore` controller without browser-wide state events.

Exit criteria:

- URL, text, file, PDF, backup import, and export flows are unchanged.
- Library interactions work with keyboard, pointer, and mobile touch.

## Phase 4 — Player and narration

Status: **complete in the React/Astryx shell**

Goals:

- Migrate the player layout, transport controls, progress slider, bookmarks, timer, and read-along modes.
- Isolate playback state behind a tested React-facing controller.
- Preserve Media Session integration and automatic segment continuation.

Exit criteria:

- Browser, Google, Azure, and ElevenLabs playback paths pass regression tests.
- Seeking, speed, timer, read-along, autoplay, and error recovery behave as before.

## Phase 5 — Voices, dialogs, and feedback

Status: **complete in the React/Astryx shell**

Goals:

- Migrate provider tabs, voice lists, connection forms, dialogs, toasts, and status feedback.
- Replace custom overlays with Astryx accessible dialog and feedback components.

Exit criteria:

- Dialog focus management and dismissal meet accessibility expectations.
- Provider credentials remain server-only and are never persisted in browser storage.

## Phase 6 — Legacy removal and custom Sona theme

Status: **in progress**

Goals:

- Remove the imperative renderer and remaining legacy-only CSS.
- Build and validate a Sona-specific Astryx theme for color, type, spacing, radius, and motion.
- Complete visual, accessibility, bundle-size, and device QA.

Exit criteria:

- No legacy DOM renderer remains.
- `astryx doctor`, the automated suite, and production build pass.
- Desktop and mobile playback receive a final physical-device check.
