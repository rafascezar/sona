# Changelog

All notable changes to Sona are documented here. Versions follow [Semantic Versioning](https://semver.org/).

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
