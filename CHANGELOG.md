# Changelog

All notable changes to Sona are documented here. Versions follow [Semantic Versioning](https://semver.org/).

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
