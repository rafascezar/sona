# Changelog

All notable changes to Sona are documented here. Versions follow [Semantic Versioning](https://semver.org/).

## [0.9.1] - 2026-11-25

- Reflow the current-article summary and player option grid cleanly on narrow screens and at high browser zoom.
- Replace clickable library and queue rows containing nested controls with explicit, independently labelled actions for reliable keyboard navigation.
- Keep route headings programmatically focusable without forcing a large initial focus outline or moving focus away from navigation.
- Preserve the v0.8.1 audio engine and private Site access unchanged.

## [0.9.0] - 2026-11-25

- Reorganized the React/Astryx views around a shared padded content frame, with narrower import forms and a persistent compact player footer.
- Replaced oversized display headings and wrapping text transport buttons with regular page headings and named icon controls for 15-second skips.
- Added compact mobile artwork and a two-column player on wide screens; grouped speed, sleep timer, bookmark and voice controls.
- Moved backup and sync tools into a collapsed library section and simplified queue actions.
- Raised desktop reading text to 16 through the official Astryx theme editor; preserved its touch-device typography adaptation.
- Added page-title focus on navigation and announced bookmark toggle state. Production DOM tests cover named controls, slider labels and a single main landmark under both breakpoint branches.
- Audio behavior remains the v0.8.1 implementation. Live responsive, keyboard and screen-reader review remains pending because browser access and preview infrastructure were unavailable.

## [0.8.1] - 2026-11-24

- Lock-screen and in-app skip controls now seek in media seconds within the loaded audio instead of estimating a number of sentences and replacing the audio source.
- Honor Media Session seek offsets and seek-to events; publish current position and playback rate.
- Reuse previously heard chunks when crossing their boundaries. Unheard chunks still require an estimated sentence boundary and cloud preparation.
- Pause and resume retain the loaded cloud audio and its exact position.
- Added regression coverage for custom skip offsets, paused seeking, cached chunk transitions, and media handler cleanup.

## [0.8.0] - 2026-11-24

- Removed the hidden imperative page renderer and legacy stylesheet; React/Astryx now owns every view, confirmation and notification.
- Extracted a browser engine with explicit startup, immutable snapshots, semantic commands and cleanup.
- Restored artwork, full read-along, bookmark navigation, explicit speed/timer choices, library sync and backup tools.
- Registered the generated Sona theme through the official Astryx theme module.
- Replaced tests of hidden legacy markup with engine and visible React integration checks.
- Preserved Safari byte ranges and the iPhone gesture unlock confirmed in v0.7.2.

## [0.7.2] - 2026-11-24

- Unlocks the iOS/WebKit media element synchronously during the Play gesture before cloud preparation begins.
- Uses a short embedded silent WAV to preserve playback authorization while narration is prepared.

## [0.7.1] - 2026-11-24

- Added HTTP byte-range responses for Google, Azure, and ElevenLabs narration so Safari/iOS can open ticketed audio reliably.
- Added `Accept-Ranges`, `Content-Range`, and accurate partial-content lengths for cached and newly generated audio.
- Enabled inline mobile playback and made audio cleanup tolerant of Safari media-element exceptions.
- Added a regression test for Safari-style `Range: bytes=0-2` requests.

## [0.7.0] - 2026-11-24

### Added

- React/Astryx library, intake, player, queue, and voices surfaces.
- Accessible provider tabs, credential dialogs, disconnect confirmation, and voice search.
- React playback controls for seeking, speed, bookmarks, sleep timer, and read-along mode.

### Changed

- All primary views now use the generated Sona theme and controller snapshots.
- The imperative renderer is hidden and retained only as a temporary engine adapter pending final removal.

## [0.4.0] - 2026-11-24

### Added

- An immutable React-facing controller for navigation and public application snapshots.
- Production-entry integration tests for the React/Astryx shell and legacy engine synchronization.
- Isolated, tested migration surfaces for library/intake, playback state, and voice providers.
- A generated Sona Astryx theme with warmer type, roomier spacing, and muted sage accents.

### Changed

- Navigation no longer relies on browser-wide custom events.
- The side navigation is larger and resizable, with its width saved locally.
- Playback progress and cloud status publish independently from legacy rendering.

## [0.3.0] - 2026-11-24

### Added

- Astryx AppShell, SideNav, and automatic mobile navigation.
- A tested event bridge between React navigation and the existing Sona view engine.
- Accessible selected-page state and mobile drawer behavior.

### Changed

- Desktop and mobile navigation are now owned by React/Astryx.
- The legacy renderer now owns only page content, playback, and feature behavior.
- The playback dock is centered within the Astryx application shell.

## [0.2.0] - 2026-11-24

### Added

- React 19 and Astryx Core as the new UI foundation.
- Astryx neutral theme, embedded fonts, reset, and component styles in the Worker bundle.
- A React compatibility shell that preserves the existing Sona application engine.
- An incremental six-phase Astryx migration plan with explicit exit criteria.
- Astryx CLI guidance and automated project health checks.

### Changed

- The browser entry point now mounts through React before loading the existing UI.
- The build embeds Astryx CSS and fonts so the private Site remains self-contained.

## [0.1.1] - 2026-11-24

### Fixed

- Decode Base64 audio returned by the Lire bridge instead of treating JSON as MP3.
- Detect MP3, WAV, Ogg, and MP4 audio and return the matching media type.
- Discard invalid cached narration automatically and regenerate it on the next play.

## [0.1.0] - 2026-11-24

### Added

- Initial versioned release of the personal article reader.
- Article URL, text, file, and text-based PDF imports.
- Local and cloud-synced reading libraries.
- Listening queue, bookmarks, progress, and backup import/export.
- Browser, Google Chirp 3 HD, Azure Neural, and ElevenLabs narration paths.
- Responsive desktop and mobile interfaces with sentence-level read-along playback.
- Visible version labels in the app wordmark and browser title.
