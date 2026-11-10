# Sona / Stillwater

A private personal article reader with ElevenLabs streaming and a cloud-synced library. Built from the approved Stillwater designs and abstract motion artwork.

## Working features

- Public article URL extraction through a same-origin Worker endpoint with Readability and safe redirect validation.
- Paste text, upload TXT/Markdown/HTML, and text-based PDFs (PDF.js loaded on demand).
- Local saved library, reading positions, finished states, bookmarks and listening queue.
- Real device speech voices, sentence-level read-along, seek, approximate 15-second skips, speed, timer and autoplay.
- Responsive mobile and desktop layouts, keyboard playback and library backup import/export.
- Six approved motif artwork families selected by a lightweight content keyword heuristic. Artwork is selected, not newly AI-generated for every article.

## Cloud upgrade

The library now syncs privately through per-user R2 snapshots, with optimistic revisions, update stamps and deletion tombstones. Existing local data migrates on first connection. Voice credentials are entered in a one-time password field, sent over HTTPS to the server, validated with ElevenLabs, and stored only in private R2 with encryption at rest. They are never returned to the client or put in localStorage. Runtime secret ELEVENLABS_API_KEY is also supported. Voice/model discovery, streamed MP3 output, content-addressed audio caching, media session metadata and sentence-aligned segments are implemented. A real connected key is still needed for audible end-to-end verification.

## Privacy and limits

Library data syncs to private cloud storage and is also cached in this browser for connection failures. Export a JSON backup from the desktop sidebar. The hosted Site is owner-private and may show the platform's access gate; the app has no account screens.

Narration defaults to ElevenLabs streaming after the user connects their account in the private app. Generation consumes provider credits; cached replays reuse audio. Device/browser speech remains an explicit fallback. Keep the page open while listening; cross-device read-along timing is estimated.

Public URL extraction cannot bypass paywalls, logins, JavaScript-only pages, or publisher blocks. Paste text when a link cannot be imported. PDF import supports text layers; scanned PDFs require OCR elsewhere. PDF.js and Google Fonts are loaded from their public CDNs. No audio export or background/offline audio guarantee.

## Development

Node 24. Install with `npm install --cache /tmp/sona-npm-cache`, then `npm run build` and `npm test`. Build embeds all app assets and approved artwork in a Cloudflare Worker at `dist/server/index.js`. A small custom build is used because the Sites starter/helper files were not installed in this environment. No separate preview was launched because the managed Sites browser tool was unavailable. Tests cover the runtime DOM with mocked speech, server routes, extraction, and core functions; real audible browser playback still needs a device check.
