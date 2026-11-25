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
