# Sona / Stillwater

A private personal article reader with browser text-to-speech. Built from the approved Stillwater designs and abstract motion artwork.

## Working features

- Public article URL extraction through a same-origin Worker endpoint with Readability and safe redirect validation.
- Paste text, upload TXT/Markdown/HTML, and text-based PDFs (PDF.js loaded on demand).
- Local saved library, reading positions, finished states, bookmarks and listening queue.
- Real device speech voices, sentence-level read-along, seek, approximate 15-second skips, speed, timer and autoplay.
- Responsive mobile and desktop layouts, keyboard playback and library backup import/export.
- Six approved motif artwork families selected by a lightweight content keyword heuristic. Artwork is selected, not newly AI-generated for every article.

## Privacy and limits

Library data is stored only in this browser's localStorage, not synchronized across devices. Export a JSON backup from the desktop sidebar. The hosted Site is owner-private and may show the platform's access gate; the app has no account screens.

Narration uses the Web Speech API and device/browser-provided voices, not ElevenLabs. Available voices vary by browser and operating system; online device voices may require connectivity. Keep the page open while listening. No ElevenLabs key is configured or requested by the app.

Public URL extraction cannot bypass paywalls, logins, JavaScript-only pages, or publisher blocks. Paste text when a link cannot be imported. PDF import supports text layers; scanned PDFs require OCR elsewhere. PDF.js and Google Fonts are loaded from their public CDNs. No audio export or background/offline audio guarantee.

## Development

Node 24. Install with `npm install --cache /tmp/sona-npm-cache`, then `npm run build` and `npm test`. Build embeds all app assets and approved artwork in a Cloudflare Worker at `dist/server/index.js`. A small custom build is used because the Sites starter/helper files were not installed in this environment. No separate preview was launched because the managed Sites browser tool was unavailable. Tests cover the runtime DOM with mocked speech, server routes, extraction, and core functions; real audible browser playback still needs a device check.
