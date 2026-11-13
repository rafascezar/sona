# Sona / Stillwater — mobile continuation

Project: appgprj_6af2938045c08191b8053c6fb23899ef
Live app: https://sona-stillwater-reader.orafacezar.chatgpt.site
Source checkout: /workspace/sites/sona-stillwater
Source is pushed to the Site's cloud repository. Preserve owner-only access and the existing project ID.

## User decisions

Personal single-user tool, no app login/signup, account, preferences onboarding, or subscription screens. Bottom navigation: Library, Add, Queue. High-quality narration through Google Chirp 3 HD and Azure Neural free tiers, plus optional ElevenLabs free/paid streaming. Provider keys are entered in the app and stored server-side per user. Private cloud library and cross-device continuation. Continue this chat on a phone when available under the same Codex account.

Approved art: src asset public/art/approved.png. Six translucent low-contrast luminous long-exposure photographic motifs: technology (ghosted laptop at an angle), care (hands), landscape (ridge), growth (petals), connection (people), discovery (leaves). Heavy camera traces, colored light, refined photographic abstraction. No cartoon product rendering, no flat gray haze. Separate SVG viewBox crops serve the original artwork correctly at /art/<theme>.svg.

## Architecture

Cloudflare Worker with esbuild, HTML/CSS/JS. src/cloud.js owns private per-user R2 library snapshot sync with ETag compare-and-swap; per-article update stamps and deletion tombstones merge concurrent devices. Existing local library uploads on first successful cloud connection. No source storage of API keys. One-time provider password forms validate and store Google and Azure API keys per user in private R2; keys are never returned to the client. Optional GOOGLE_TTS_API_KEY, AZURE_TTS_KEY, and AZURE_TTS_REGION environment secrets are supported. Google Chirp 3 HD and Azure Neural responses use expiring private tickets and hashed audio-cache objects. Existing ElevenLabs credentials and routes remain available.

ElevenLabs: voices/models loaded from account; prefer v4 Turbo where returned by API, otherwise an available realtime model. /api/eleven/prepare resolves a cloud article into a sentence-aligned passage and expiring ticket. /api/eleven/audio streams MP3 from provider, caches under hashed content/voice/model/context key, and streams cached replay. HTMLAudioElement drives playback and mobile media session. Read-along timestamps are estimated, not forced alignment. Generation uses the user's credits. A real provider key and physical phone are required for end-to-end audible verification.

## Verification and publication

npm run build; npm test. Build embeds static files and artwork in dist/server/index.js. Build helper resources are absent in this environment, so the custom bundle and ordinary Git preserve supported deployment format. Archive root must include .openai/hosting.json and dist/server/index.js (do not strip dist).

Use native Sites write credential, keep secrets in memory/stdin, push exact source, package then save_version_and_deploy_private once owner-only access is confirmed. Private access is represented by custom policy with only owner allowed.
