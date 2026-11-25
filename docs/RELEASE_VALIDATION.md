# v0.10.0 validation

- The interface now follows the supplied mobile audiobook references through a Sona-specific, cover-led Home, direct import shortcuts, persistent mini player, bottom navigation and portrait player layout. No ElevenReader branding or catalog content was copied.
- All new structure uses Astryx components and tokens. Astryx Doctor passes 27 checks with zero warnings/failures.
- Production build and all 47 automated tests pass. The production-entry harness covers the revised Home copy, mobile navigation, import routing, player controls and both media-query branches.
- Managed preview still times out while opening its port-4173 relay in this environment, so the new mobile composition could not be visually captured here. Automated DOM checks are not counted as visual validation; inspect the published build on phone and desktop.
- Audio, Media Session handlers, provider synthesis, private storage and Site access are unchanged. Repeat audible playback and lock-screen skips on the published UI.

# v0.9.1 validation

- Production desktop rendering was reviewed in the owner's authenticated Codex browser. The app frame, library lead, search/filter controls, current article, saved rows and persistent player footer rendered coherently at the captured 1234px-wide viewport.
- Narrow layouts now stack the current-article artwork and reflow the player option grid instead of forcing two cramped columns. Library and queue rows use independent labelled controls rather than nesting buttons inside clickable rows.
- Route headings remain programmatically focusable but are no longer focused automatically on every mount. This avoids an oversized initial focus outline while leaving navigation controls in a predictable focus position.
- Production build and all 47 automated tests passed; Astryx Doctor passed 27 checks with zero warnings/failures.
- The authenticated local browser session was visible but not controllable from this agent connection, so direct mobile resizing, 200% browser zoom, full keyboard traversal, dialog focus trapping and screen-reader testing remain owner-side checks. DOM tests are not counted as visual validation.
- Audio engine behavior is unchanged from v0.8.1. The previously confirmed iPhone playback and lock-screen skips remain the applicable physical-device evidence; repeat them after this UI-only release when convenient.

# v0.9.0 validation

- Production build and all 47 automated tests passed; Astryx Doctor passed 27 checks with zero warnings/failures. TypeScript prop checking remains informational because TypeScript is not installed.
- The production-entry DOM harness checks navigation, a single main landmark and page heading, route-title focusability, labelled transport/slider controls, bookmark toggle state and collapsed saved passages. Both narrow and wide media-query branches run; this is not a browser layout or keyboard test.
- The shared frame now uses LayoutContent to apply the Layout padding, while the outer Layout owns the scroll region and persistent player footer. Artwork and player columns adapt at the wide breakpoint.
- Desktop base reading size is 16 through the official theme editor. Theme outputs are current according to Doctor. The theme screenshot command produced an organization-blocked page rather than rendered component previews, so it did not verify typography or contrast visually.
- Managed preview previously failed with a port-4173 relay readiness timeout. The hosted review browser still reached the sign-in page after the owner reported login; its session was separate from the owner's client. Opening the Cloud Desktop viewer also reported that no available Cloud environment was attached.
- Live mobile/desktop layout, 200% zoom, keyboard focus visibility/order, dialog focus trapping, screen readers and real-device touch targets remain pending. This release improves the implementation and semantic regression coverage; it does not complete visual/accessibility sign-off.
- Audio engine changes are limited to its displayed version. Existing iOS audio-prime, cached seek and Media Session regression tests remain passing. The owner confirmed working audible playback and lock-screen skips before this UI release; repeat these on the deployed UI.

# v0.8.1 validation

- Build and all 45 automated tests passed; Astryx Doctor passed 27 checks with zero warnings/failures.
- New mocked Media Session cases exercise exact in-chunk seconds, custom OS skip offsets, pause/seek/resume without a new request, backward transitions into a cached chunk, and seek-to handler cleanup.
- Physical iPhone lock-screen verification remains pending. Unheard chunks lack measured timing; crossing into them still estimates the sentence boundary and prepares new audio. This release does not claim forced-aligned article-wide timestamps.

# v0.8.0 validation

- Production build: passed.
- Automated suite: 43 tests passed, none skipped.
- Astryx Doctor: 27 checks passed, zero warnings/failures (type checking is informational because TypeScript is not installed).
- Worker artifact: 4,707,064 bytes; gzip 2,229,193 bytes. This includes approved artwork and embedded fonts, not only application JavaScript.
- Legacy page renderer and legacy stylesheet: removed; production React tests assert the old mount is absent.
- Theme: official generated Astryx theme module; no local color overrides.

The DOM harness exercises the actual React entry and engine but stubs layout APIs. Managed browser preview started the app; its relay timed out opening port 4173, so screenshots, real keyboard focus, visual contrast and responsive review are unverified for this release.

Cloud audio worked in Chrome on the owner's iPhone at v0.7.2. Automated v0.8.0 tests preserve the synchronous media prime, verify stale audio is aborted, and exercise private audio byte ranges. Repeat audible playback after this extraction, then test screen locking, interruption recovery and audio-route changes before calling the migration fully device-validated.

PDF parsing retains the existing on-demand PDF.js CDN dependency. Scanned documents require OCR. Provider synthesis tests use mocked responses; they do not spend real Google/Azure/ElevenLabs quota.
