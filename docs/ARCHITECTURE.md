# Architecture

## Runtime

Sona is a Cloudflare Worker application assembled with esbuild. The build embeds the frontend assets and approved artwork into `dist/server/index.js`, which exposes both the application shell and server API routes.

The frontend uses React 19 and Astryx. `main.jsx` owns the application shell, page regions, layers and navigation. All visual components use the generated Sona Astryx theme. There is no hidden legacy DOM renderer or separate production asset server.

`sona-engine.js` owns persistence, imports, cloud synchronization, speech and audio resources. It starts explicitly after React mounts and publishes immutable snapshots through `sona-controller.js`; React sends semantic commands through the same controller. API keys and audio tickets are excluded from public snapshots. Notifications and deletion confirmation are rendered through Astryx layers.

## Library and synchronization

The browser keeps a local library for fast startup and offline-tolerant reading. Signed-in users can synchronize private snapshots through per-user R2 storage.

Synchronization uses:

- optimistic snapshot revisions;
- per-article update timestamps;
- deletion tombstones; and
- a merge step for concurrent device changes.

An existing local library is uploaded on the first successful cloud connection. Users can also export and import a JSON backup.

## Content import

Public article URLs are fetched by the Worker and extracted with Mozilla Readability. Redirect targets are validated to prevent unsafe network access. The browser can also ingest pasted text and TXT, Markdown, HTML, or text-based PDF files.

PDF.js is loaded on demand for PDF parsing. Scanned documents are outside the current scope.

## Narration

The playback layer supports browser speech and server-generated audio.

Cloud providers prepare sentence-aligned passages and issue short-lived private audio tickets. The browser uses `HTMLAudioElement` for playback and the Media Session API where available. Read-along timings are estimated from the generated passage rather than obtained through forced alignment.

Generated audio is stored under content-addressed cache keys derived from provider, voice, model, and text context.

### Google Cloud

Google Chirp 3 HD requests are proxied through the companion Lire service. All synthesis shares Lire's global monthly character allowance; direct Google credentials and unmetered fallbacks are intentionally disabled.

### Azure Neural

Azure credentials can be stored per user in private R2 or provided as runtime secrets. Azure's free tier permits only one concurrent synthesis request.

### ElevenLabs

ElevenLabs voices and models are discovered from the connected account. The server prefers a returned low-latency model and streams MP3 output. Credentials can be stored per user or supplied through a runtime secret.

## Credential handling

Provider keys are submitted over HTTPS, validated server-side, and stored only in private server storage with encryption at rest. They are never returned to the frontend or persisted in browser storage.

No credentials should be committed to this repository. Deployment-specific values belong in the hosting environment.

## Artwork

The approved source artwork is stored at `public/art/approved.png`. Six theme crops—technology, care, landscape, growth, connection, and discovery—are selected by a lightweight keyword heuristic and served through SVG view boxes.

## Verification

Run:

```bash
npm run build
npm test
npm run astryx:doctor
```

The automated suite covers shared core functions, cloud synchronization, Google/Lire bridging, server routes, the independent engine and the actual React entry in a DOM harness. That harness has no layout engine. Audible playback, lock-screen controls, Bluetooth routing and background interruption recovery still require physical-device checks. The user confirmed cloud playback in Chrome on iPhone at v0.7.2; later engine refactors need the same confirmation.
