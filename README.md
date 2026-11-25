# Sona v0.2.0

Sona is a private, personal reading and listening space for articles and saved text. It combines a calm reading interface, sentence-level read-along narration, a listening queue, and a cloud-synced library.

The current app uses the original vanilla JavaScript interface, bundled into a Cloudflare Worker and deployed through OpenAI Sites. The former React/Astryx experiment is preserved separately at the `sona-astryx-v0.1.0` tag and `releases/sona-v0.1.0-astryx` branch.

## Features

- Import public article URLs through a safe same-origin extraction endpoint.
- Paste text or upload TXT, Markdown, HTML, and text-based PDF files.
- Save articles, reading positions, finished states, bookmarks, and a listening queue.
- Listen with browser voices or supported cloud narration providers.
- Follow sentence-level read-along highlighting and use seek, skip, speed, timer, and autoplay controls.
- Sync a private library across devices with conflict-aware snapshots.
- Import and export library backups as JSON.
- Use responsive layouts on desktop and mobile.
- Display six abstract artwork themes selected from article content.

## Narration providers

Sona supports:

- Browser/device speech as a local fallback.
- Google Cloud Chirp 3 HD through the companion Lire service and its shared quota.
- Azure Neural voices with a user-provided key or server-side runtime credentials.
- ElevenLabs with a user-provided key or server-side runtime credentials.

Provider credentials are validated on the server and stored in private per-user storage. They are never returned to the browser or written to `localStorage`. Generated audio is cached by provider, voice, and content so repeat listens can reuse it.

## Project structure

```text
src/
  app.js       Vanilla application interface and playback behavior
  sona-controller.js Small navigation/controller bridge
  cloud.js     Private library and narration API routes
  core.js      Shared parsing and reading utilities
  page.html    Application markup
  server.js    Cloudflare Worker routes and provider integrations
public/art/    Approved artwork source
tests/         Unit and runtime tests
build.mjs      Worker bundle and asset build
```

More implementation detail is available in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Versioning

Sona follows [Semantic Versioning](https://semver.org/). The current version is shown beside the Sona wordmark in the app, in the browser title, and in `package.json`.

- Patch releases (`0.1.x`) contain fixes and small refinements.
- Minor releases (`0.x.0`) add backward-compatible features.
- Major releases (`x.0.0`) may introduce incompatible changes.

Release notes are recorded in [CHANGELOG.md](CHANGELOG.md).

## Local development

Requirements:

- Node.js 24
- npm

Install dependencies, build, and run the test suite:

```bash
npm ci
npm run build
npm test
```

Local preview has no private R2 binding; cloud providers are exercised on the hosted Site. Rebuild after source changes.

The build produces a deployable Cloudflare Worker at `dist/server/index.js`. Generated files in `dist/` are intentionally excluded from version control.

## Privacy and limitations

- Sona is designed as a personal tool; it does not include public signup, subscription, or account-management screens.
- URL extraction cannot bypass paywalls, authentication, JavaScript-only pages, or publisher blocks.
- PDF import supports documents with a text layer. Scanned PDFs require OCR before import.
- Read-along timestamps are estimated rather than forced-aligned.
- Cloud narration consumes the configured provider's quota. Cached playback does not regenerate audio.
- iPhone playback is unlocked by the initiating gesture, and Media Session controls seek the loaded cloud audio in real seconds.

## Deployment

Hosting configuration lives in `.openai/hosting.json`. The source repository connected to OpenAI Sites remains the deployment source of record; this GitHub repository is the public project mirror.

Do not commit API keys or provider credentials. Runtime secrets belong in the hosting environment.
