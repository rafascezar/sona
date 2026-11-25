import { mergeStates } from "./cloud.js";
import { classify, sentences, duration, clamp, validArticle } from "./core.js";
import { sonaController } from "./sona-controller.js";
import { starterArticles } from "./starter-articles.js";
import { prepareArticleImport } from "./article-import.js";
import { downloadText } from "./browser-download.js";
const VERSION = "v0.8.0", VIEWS = /* @__PURE__ */ new Set(["library", "add", "queue", "voices", "player"]), PROVIDERS = /* @__PURE__ */ new Set(["google", "azure", "eleven", "device"]), RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const initial = (now) => ({ articles: starterArticles.map((article) => ({ ...article, position: 0, bookmarks: [], added: now })), queue: [], currentId: "attention", rate: 1, voiceURI: "", audioEngine: "google", autoplay: true, deleted: {} });
function silentAudioSource(){
  const bytes=new Uint8Array(204),view=new DataView(bytes.buffer);
  for(const [offset,text] of [[0,'RIFF'],[8,'WAVE'],[12,'fmt '],[36,'data']])bytes.set([...text].map(c=>c.charCodeAt(0)),offset);
  view.setUint32(4,196,true);view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);
  view.setUint32(24,8000,true);view.setUint32(28,16000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);view.setUint32(40,160,true);
  return 'data:audio/wav;base64,'+btoa(String.fromCharCode(...bytes));
}
function startSonaEngine(options = {}) {
  const env = options.env || globalThis, controller = options.controller || sonaController, storage = options.storage || env.localStorage, fetcher = options.fetch || env.fetch?.bind(env), now = options.now || Date.now;
  let state = initial(now()), hasLocal = false;
  try {
    const raw = storage?.getItem("sona.v1");
    hasLocal = !!raw;
    const saved = JSON.parse(raw);
    if (saved?.articles) state = { ...state, ...saved, articles: saved.articles.filter(validArticle).map((a) => ({ ...a, bookmarks: Array.isArray(a.bookmarks) ? a.bookmarks : [], position: Math.max(0, Number(a.position) || 0) })), deleted: saved.deleted || {} };
  } catch {
  }
  let view = "library", query = "", filter = "all", importMode = "url", preview = null, busy = false, importError = "", readMode = false, playing = false, loading = false, timer = null, timerUntil = 0, notice = null, dialog = null, noticeId = 0;
  let cloudStatus = "Connecting to cloud\u2026", cloudReady = false, cloudSaving = false, cloudRevision = null, syncTimer, syncPromise=null, initPromise=null, cloudDirty=true, providers = { connected: false, google: false, azure: false }, catalog = { google: [], azure: [], eleven: [], device: [] }, voiceStatus = "idle", voiceError = "";
  let audio = typeof env.Audio === "function" ? new env.Audio() : null, abort = null, token = 0, unlocking = false, alive = true;
  const cleanups = [], fingerprints = new Map(state.articles.map((a) => [a.id, JSON.stringify(a)]));
  if (audio) audio.playsInline = true;
  const current = () => state.articles.find((a) => a.id === state.currentId), progress = (a) => Math.round(clamp((a?.position || 0) / Math.max(1, sentences(a?.text || "").length), 0, 1) * 100);
  function voice() {
    const provider = state.audioEngine, list = catalog[provider] || [], selectedVoiceId = provider === "device" ? state.voiceURI : provider === "eleven" ? state.elevenVoice : state[provider + "Voice"];
    return { provider, providers: { google: { isConnected: !!providers.google, isViaLire: !!providers.googleViaLire, status: providers.google ? "ready" : "idle" }, azure: { isConnected: !!providers.azure, isViaLire: !!providers.azureViaLire, status: providers.azure ? "ready" : "idle" }, eleven: { isConnected: !!providers.connected, isViaLire: false, status: providers.connected ? "ready" : "idle" }, device: { isConnected: true, isViaLire: false, status: "ready" } }, voices: list.map((v) => ({ id: v.id || v.voiceURI, name: v.name, language: v.language || v.lang || "", description: v.description || "" })), selectedVoiceId: selectedVoiceId || "", isLoading: voiceStatus === "loading", status: voiceStatus, error: voiceError };
  }
  function snapshot() {
    const a = current(), parts = sentences(a?.text || ""), articles = state.articles.map((x) => ({ id: x.id, title: x.title, source: x.source || "", author: x.author || "", url: x.url || "", theme: x.theme || "growth", position: x.position || 0, finished: !!x.finished, progress: progress(x), duration: duration(x.text) })), map = new Map(articles.map((x) => [x.id, x])), remaining = Math.max(0, Math.ceil((timerUntil - now()) / 6e4));
    return { view, query, filter, importMode, busy, importError, timerUntil, timerMinutes: [0, 15, 30, 45, 60].find((x) => x >= remaining) ?? 60, autoplay: !!state.autoplay, voice: voice(), preview: preview ? { title: preview.title, source: preview.source || "Your library", duration: duration(preview.text), excerpt: preview.text.slice(0, 190) + "\u2026" } : null, currentId: state.currentId, currentArticle: a ? { id: a.id, title: a.title, source: a.source || "", author: a.author || "", theme: a.theme || "growth", position: a.position || 0, sentenceCount: parts.length, activeSentence: parts[a.position || 0] || "", duration: duration(a.text), isBookmarked: (a.bookmarks || []).includes(a.position || 0), sentences: parts.map((text, index) => ({ index, text })), bookmarks: [...a.bookmarks || []] } : null, articles, queue: [...state.queue], queueArticles: state.queue.map((id) => map.get(id)).filter(Boolean), playback: { playing, loading, rate: state.rate, engine: state.audioEngine, readMode, position: a?.position || 0, sentenceCount: parts.length, timerUntil }, cloudStatus, notice, dialog };
  }
  const publish = () => alive && controller.publish(snapshot()), notify = (message) => {
    notice = { id: String(++noticeId), message: String(message) };
    publish();
    return true;
  };
  function persist() {
    cloudDirty=true;
    const stamp = now();
    for (const a of state.articles) {
      const next = JSON.stringify(a);
      if (next !== fingerprints.get(a.id)) {
        a.updatedAt = stamp;
        fingerprints.set(a.id, JSON.stringify(a));
      }
    }
    for (const id of fingerprints.keys()) if (!state.articles.some((a) => a.id === id)) {
      state.deleted[id] = stamp;
      fingerprints.delete(id);
    }
    state.updatedAt = stamp;
    try {
      storage?.setItem("sona.v1", JSON.stringify(state));
    } catch {
      notify("Storage is full. Export your library to keep a backup.");
    }
    if (cloudReady) {
      env.clearTimeout(syncTimer);
      syncTimer = env.setTimeout(() => syncCloud(), 700);
    }
    publish();
  }
  function media() {
    const a = current();
    if (!a || !env.navigator?.mediaSession || !env.MediaMetadata) return;
    env.navigator.mediaSession.metadata = new env.MediaMetadata({ title: a.title, artist: a.author || a.source, album: `Sona ${VERSION} / Stillwater`, artwork: [{ src: (env.location?.origin || "") + "/art/" + a.theme + ".svg", type: "image/svg+xml" }] });
    env.navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }
  function stop() {
    token++;
    env.speechSynthesis?.cancel();
    abort?.abort();
    abort = null;
    if (audio) {
      audio.onplaying = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
      try {audio.pause();audio.removeAttribute?.("src");audio.load?.();}catch{}
    }
    playing = false;
    loading = false;
    media();
    publish();
  }
  function cancelForPrime() {
    token++;
    env.speechSynthesis?.cancel();
    abort?.abort();
    abort = null;
    if (audio) {
      audio.onplaying = null;
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
    }
    playing = false;
    loading = false;
  }
  function unlock() {
    if (!audio || unlocking) return;
    unlocking = true;
    audio.onplaying = null;
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.onerror = null;
    try {
      audio.src = silentAudioSource();
      audio.play().catch(() => {
      });
    } catch {
    }
    env.setTimeout(() => unlocking = false, 1e3);
  }
  function finish() {
    const a = current();
    if (a) {
      a.finished = true;
      a.position = 0;
    }
    stop();
    persist();
    if (state.autoplay && state.queue.length) {
      state.currentId = state.queue.shift();
      persist();
      play(0);
    } else notify("Finished. A little more room for your next story.");
  }
  function play(index) {
    return ["google", "azure", "eleven"].includes(state.audioEngine) ? premium(index) : device(index);
  }
  function userPlay(index) {
    if (["google", "azure", "eleven"].includes(state.audioEngine)) {
      cancelForPrime();
      unlock();
      return premium(index, true);
    }
    return device(index);
  }
  function device(index) {
    const a = current();
    if (!a) return false;
    if (!env.speechSynthesis || !env.SpeechSynthesisUtterance) return notify("Read-aloud is not supported in this browser.");
    stop();
    const parts = sentences(a.text);
    a.position = clamp(index, 0, parts.length - 1);
    a.finished = false;
    playing = true;
    const guard = token;
    persist();
    const run = () => {
      if (guard !== token || !playing) return;
      const text = parts[a.position];
      if (!text) return finish();
      const u = new env.SpeechSynthesisUtterance(text);
      u.rate = state.rate;
      const selected = catalog.device.find((v) => v.voiceURI === state.voiceURI);
      if (selected) {
        u.voice = selected;
        u.lang = selected.lang;
      }
      u.onend = () => {
        if (guard !== token) return;
        a.position++;
        persist();
        a.position >= parts.length ? finish() : run();
      };
      u.onerror = (e) => {
        if (guard === token && !["interrupted", "canceled"].includes(e.error)) {
          stop();
          notify("The voice could not play. Choose another device voice.");
        }
      };
      env.speechSynthesis.speak(u);
    };
    run();
    return true;
  }
  async function premium(index, isPrimed = false) {
    const engine = state.audioEngine, a = current();
    if (!audio || !a) return notify("Audio playback is unavailable in this browser.");
    if (!isPrimed) stop();
    const parts = sentences(a.text);
    a.position = clamp(index, 0, parts.length - 1);
    a.finished = false;
    playing = true;
    loading = true;
    const guard = token, startId = a.id, Abort = env.AbortController || globalThis.AbortController, request = new Abort();
    abort = request;
    persist();
    try {
      if (!catalog[engine].length && !await refreshVoices()) throw new Error(voiceError || "Choose a connected voice provider.");
      if (!await syncCloud()) throw new Error("Wait for Cloud saved before starting premium narration.");
      if(guard!==token||!alive)return false;
      const r = await fetcher(engine === "eleven" ? "/api/eleven/prepare" : "/api/tts/prepare", { method: "POST", signal: request.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(engine === "eleven" ? { articleId: startId, start: a.position, voice: state.elevenVoice, model: state.elevenModel } : { articleId: startId, start: a.position, voice: state[engine + "Voice"], provider: engine }) }), segment = await r.json();
      if (!r.ok) throw new Error(segment.error || "Could not prepare narration.");
      if (guard !== token) return false;
      audio.src = segment.url;
      audio.playbackRate = state.rate;
      audio.onplaying = () => {
        if (guard === token) {
          loading = false;
          media();
          publish();
        }
      };
      audio.ontimeupdate = () => {
        if (guard !== token) return;
        const chunk = parts.slice(segment.start, segment.end), seconds = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : chunk.join(" ").split(/\s+/).length / 155 * 60, total = chunk.reduce((n, s) => n + s.length, 0), target = audio.currentTime / seconds * total;
        let offset = 0, pos = segment.start;
        for (const part of chunk) {
          offset += part.length;
          if (offset >= target) break;
          pos++;
        }
        const active = current();
        if (active?.id === startId && active.position !== pos) {
          active.position = clamp(pos, segment.start, segment.end - 1);
          persist();
        }
      };
      audio.onended = () => {
        if (guard !== token) return;
        const active = current();
        if (!active) return;
        active.position = segment.end;
        persist();
        segment.end >= segment.total ? finish() : premium(segment.end);
      };
      audio.onerror = async () => {
        if(guard!==token)return;
        let message="Narration could not load. Choose another voice or try later.";
        try {const failure=await fetcher(segment.url,{signal:request.signal});if(!failure.ok){const detail=await failure.json();if(detail.error)message=detail.error;}else await failure.body?.cancel();}catch{}
        if(guard===token){stop();notify(message);}
      };
      await audio.play();
      return true;
    } catch (e) {
      if (e.name === "AbortError" || guard !== token) return false;
      stop();
      notify(e.name === "NotAllowedError" ? "Your browser needs another tap to start audio. Press play again." : e.message);
      return false;
    }
  }
  function seek(position) {
    const a = current();
    if (!a) return false;
    a.position = clamp(Number(position) || 0, 0, sentences(a.text).length - 1);
    a.finished = false;
    persist();
    if (playing) play(a.position);
    return true;
  }
  function loadDevice() {
    catalog.device = env.speechSynthesis?.getVoices() || [];
    if (!state.voiceURI && catalog.device.length) state.voiceURI = (catalog.device.find((v) => v.default) || catalog.device[0]).voiceURI;
    voiceStatus = "ready";
    persist();
  }
  async function refreshVoices() {
    const p = state.audioEngine;
    voiceStatus = "loading";
    voiceError = "";
    publish();
    try {
      if (p === "device") loadDevice();
      else {
        const r = await fetcher(p === "eleven" ? "/api/eleven/voices" : "/api/tts/voices?provider=" + p), data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load voices.");
        catalog[p] = data.voices || [];
        if (p === "eleven") {
          state.elevenVoice = state.elevenVoice || catalog[p][0]?.id || "";
          state.elevenModel = state.elevenModel || data.models?.[0]?.id || "eleven_multilingual_v2";
        } else state[p + "Voice"] = state[p + "Voice"] || catalog[p][0]?.id || "";
      }
      voiceStatus = "ready";
      persist();
      return true;
    } catch (e) {
      voiceStatus = "error";
      voiceError = e.message;
      publish();
      return false;
    }
  }
  async function prepareImport(c) {
    if (busy) return false;
    busy = true;
    importError = "";
    preview = null;
    publish();
    try {
      preview = await prepareArticleImport(c, { fetch: fetcher, DOMParser: env.DOMParser, loadPdf: options.loadPdf });
      return true;
    } catch (e) {
      importError = e.message;
      return false;
    } finally {
      busy = false;
      publish();
    }
  }
  async function cloudRequest(method = "GET", body) {
    const r = await fetcher("/api/cloud/library", { method, headers: body ? { "Content-Type": "application/json" } : {}, ...body ? { body: JSON.stringify(body) } : {} }), data = await r.json();
    if (!r.ok && r.status !== 409) throw new Error(data.error || "Cloud sync unavailable.");
    return { r, data };
  }
  function rememberState(){
    try{storage?.setItem('sona.v1',JSON.stringify(state));}catch{}
    fingerprints.clear();for(const a of state.articles)fingerprints.set(a.id,JSON.stringify(a));
  }
  function initCloud() {
    if(initPromise)return initPromise;
    initPromise=(async()=>{try {
      const { data } = await cloudRequest();
      if(!alive)return false;
      cloudRevision = data.revision;
      if (data.state) {
        const engine = state.audioEngine;
        state = hasLocal ? mergeStates(state, data.state) : { ...state, ...data.state };
        state.audioEngine = engine;
      }
      cloudReady = true;
      rememberState();
      cloudStatus = "Cloud connected";
      publish();
      return await syncCloud();
    } catch {
      cloudStatus = env.navigator?.onLine === false ? "Offline \xB7 saved on device" : "Cloud unavailable \xB7 saved on device";
      publish();
      return false;
    }
    })().finally(()=>{initPromise=null;});return initPromise;
  }
  function syncCloud(refresh = false) {
    if(!alive)return Promise.resolve(false);
    if (!cloudReady) return initCloud();
    if (syncPromise) return syncPromise.then(ok=>ok&&alive?syncCloud(refresh):false);
    cloudSaving = true;
    syncPromise=(async()=>{try {
      cloudStatus = "Syncing\u2026";
      publish();
      if (refresh) {
        const { data } = await cloudRequest();
        if (data.state) {
          const engine = state.audioEngine;
          state = mergeStates(state, data.state);
          state.audioEngine = engine;
          cloudRevision = data.revision;
          rememberState();
        }
      }
      for (let i = 0; i < 8&&alive; i++) {
        const sent=JSON.stringify(state);
        const { r, data } = await cloudRequest("PUT", { state, revision: cloudRevision });
        if(!alive)return false;
        cloudRevision = data.revision;
        if (r.status === 409) {
          const engine=state.audioEngine;state = mergeStates(state, data.state || {});state.audioEngine=engine;rememberState();
          continue;
        }
        cloudDirty=JSON.stringify(state)!==sent;
        if(cloudDirty)continue;
        cloudStatus = "Cloud saved";
        publish();
        return true;
      }
      throw new Error();
    } catch {
      cloudStatus = "Saved on device \xB7 sync pending";
      cloudDirty=true;
      publish();
      return false;
    } finally {
      cloudSaving = false;
    }
    })().finally(()=>{syncPromise=null;});return syncPromise;
  }
  async function importBackup(file) {
    try {
      if (!file || file.size > 15 * 1024 * 1024) throw new Error("Choose a Sona backup smaller than 15 MB.");
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.articles)||!data.articles.every(a=>validArticle(a)&&typeof a.id==='string'&&a.title.length<=250&&a.text.length<=150000)||data.articles.length+state.articles.length>500) throw new Error("This is not a valid Sona backup or exceeds 500 articles.");
      const ids = new Set(state.articles.map((a) => a.id));
      for (const a of data.articles) if (!ids.has(a.id)) {
        const count=sentences(a.text).length;
        state.articles.push({ id: env.crypto.randomUUID(),title:a.title,text:a.text,source:String(a.source||'Your library'),author:String(a.author||''),theme:classify(a.title+' '+a.text),url:/^https?:\/\//i.test(a.url||'')?a.url:'',added:now(),finished:!!a.finished, bookmarks:Array.isArray(a.bookmarks)?a.bookmarks.filter(i=>Number.isInteger(i)&&i>=0&&i<count):[],position:clamp(Math.trunc(Number(a.position)||0),0,Math.max(0,count-1)) });
        ids.add(a.id);
      }
      persist();
      return notify("Backup imported. Your existing articles were kept.");
    } catch (e) {
      return notify(e.message);
    }
  }
  function exportFile(file) {
    if (options.onExport) options.onExport(file);
    else downloadText(env, file.content, file.filename, file.mimeType);
    return file;
  }
  function remove(id) {
    if (id === state.currentId) {
      stop();
      state.currentId = null;
    }
    state.articles = state.articles.filter((a) => a.id !== id);
    state.queue = state.queue.filter((x) => x !== id);
    dialog = null;
    if (view === "player") view = "library";
    persist();
    return notify("Article removed.");
  }
  function dispatch(c) {
    if (!c?.type) return false;
    switch (c.type) {
      case "navigate":
        if (!VIEWS.has(c.view) || c.view === "player" && !current()) return false;
        view = c.view;
        publish();
        return true;
      case "set-query":
        query = String(c.query || "");
        publish();
        return true;
      case "set-filter":
        if (!["all", "unread", "finished"].includes(c.filter)) return false;
        filter = c.filter;
        publish();
        return true;
      case "open-article":
        if (!state.articles.some((a) => a.id === c.id)) return false;
        if (state.currentId !== c.id) stop();
        state.currentId = c.id;
        state.queue = state.queue.filter((id) => id !== c.id);
        view = "player";
        persist();
        if (c.play) userPlay(current()?.position || 0);
        return true;
      case "article-action": {
        const a = state.articles.find((x) => x.id === c.id);
        if (!a) return false;
        if (c.action === "remove") {
          dialog = { type: "remove-article", articleId: a.id, title: a.title };
          publish();
          return true;
        }
        if (c.action === "enqueue") {
          if (!state.queue.includes(a.id) && a.id !== state.currentId) state.queue.push(a.id);
          persist();
          return true;
        }
        if (c.action === "toggle-finished") {
          a.finished = !a.finished;
          persist();
          return true;
        }
        if (c.action === "download") {
          return exportFile({ filename: a.title + ".txt", mimeType: "text/plain", content: a.title + "\n\n" + a.text });
        }
        return false;
      }
      case "dismiss-notice":
        if (!c.id || notice?.id === c.id) notice = null;
        publish();
        return true;
      case "dismiss-dialog":
        dialog = null;
        publish();
        return true;
      case "confirm-remove":
        return dialog?.type === "remove-article" && (!c.articleId || c.articleId === dialog.articleId) && remove(dialog.articleId);
      case "notify":
        return notify(c.message);
      case "set-import-mode":
        if (!["url", "text", "file"].includes(c.mode)) return false;
        importMode = c.mode;
        preview = null;
        importError = "";
        publish();
        return true;
      case "submit-import":
        return prepareImport(c);
      case "save-preview":
        if (!preview) return false;
        {
          const item = { ...preview, id: env.crypto.randomUUID(), position: 0, bookmarks: [], added: now() };
          state.articles.unshift(item);
          preview = null;
          persist();
          if (c.play) {
            state.currentId = item.id;
            view = "player";
            userPlay(0);
          } else {
            view = "library";
            publish();
          }
          return true;
        }
      case "toggle-playback":
        if (playing) stop();
        else userPlay(current()?.position || 0);
        return true;
      case "seek":
        return seek(c.position);
      case "skip": {
        const a = current();
        if (!a) return false;
        const parts = sentences(a.text), words = a.text.split(/\s+/).length / parts.length, steps = Math.max(1, Math.round(15 / (words / (155 * state.rate) * 60)));
        return seek((a.position || 0) + (c.direction < 0 ? -steps : steps));
      }
      case "set-read-mode":
        readMode = !!c.readMode;
        publish();
        return true;
      case "bookmark": {
        const a = current();
        if (!a) return false;
        a.bookmarks ??= [];
        if (!a.bookmarks.includes(a.position || 0)) a.bookmarks.push(a.position || 0);
        persist();
        return notify("Passage bookmarked.");
      }
      case "bookmark-jump":
        return seek(c.index ?? c.position);
      case "cycle-rate":
        return dispatch({ type: "set-rate", rate: RATES[(RATES.indexOf(state.rate) + 1) % RATES.length] });
      case "set-rate":
      case "set-speed":
        state.rate = clamp(Number(c.rate) || 1, 0.5, 3);
        if (audio) audio.playbackRate = state.rate;
        persist();
        if (playing && state.audioEngine === "device") play(current().position);
        return true;
      case "cycle-timer": {
        const left = Math.max(0, Math.ceil((timerUntil - now()) / 6e4));
        return dispatch({ type: "set-timer", minutes: left === 0 ? 15 : left <= 15 ? 30 : left <= 30 ? 60 : 0 });
      }
      case "set-timer":
        env.clearTimeout(timer);
        timerUntil = 0;
        if (Number(c.minutes) > 0) {
          timerUntil = now() + Number(c.minutes) * 6e4;
          timer = env.setTimeout(() => {
            stop();
            timerUntil = 0;
            notify("Sleep timer ended. Rest well.");
          }, Number(c.minutes) * 6e4);
        }
        publish();
        return true;
      case "queue-remove":
        state.queue = state.queue.filter((id) => id !== c.id);
        persist();
        return true;
      case "queue-move-up": {
        const i = state.queue.indexOf(c.id);
        if (i > 0) [state.queue[i - 1], state.queue[i]] = [state.queue[i], state.queue[i - 1]];
        persist();
        return true;
      }
      case "set-autoplay":
        state.autoplay = !!c.value;
        persist();
        return true;
      case "voice-select-provider":
        if (!PROVIDERS.has(c.provider)) return false;
        stop();
        state.audioEngine = c.provider;
        persist();
        return refreshVoices();
      case "voice-select": {
        const p = state.audioEngine, list = catalog[p];
        if (!list.some((v) => (v.id || v.voiceURI) === c.voiceId)) return false;
        const wasPlaying=playing;stop();
        if (p === "device") state.voiceURI = c.voiceId;
        else if (p === "eleven") state.elevenVoice = c.voiceId;
        else state[p + "Voice"] = c.voiceId;
        persist();
        if(wasPlaying)userPlay(current()?.position||0);
        return true;
      }
      case "voice-refresh":
        return refreshVoices();
      case "voice-connect":
        return (async () => {
          const p = c.provider;
          if (!["azure", "eleven"].includes(p)) return false;
          const body = p === "eleven" ? { key: String(c.key || "") } : { provider: p, key: String(c.key || ""), region: c.region }, r = await fetcher(p === "eleven" ? "/api/eleven/connect" : "/api/tts/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          body.key = "";
          if (!r.ok) {
            voiceStatus = "error";
            voiceError = "Could not connect provider.";
            publish();
            throw new Error(voiceError);
          }
          providers[p === "eleven" ? "connected" : p] = true;
          state.audioEngine = p;
          persist();
          if (!await refreshVoices()) throw new Error(voiceError);
          return true;
        })();
      case "voice-disconnect":
        return (async () => {
          const p = c.provider;
          if (!PROVIDERS.has(p) || p === "device") return false;
          stop();
          const r = await fetcher(p === "eleven" ? "/api/eleven/connect" : "/api/tts/connect?provider=" + p, { method: "DELETE" });
          if (!r.ok) throw new Error("Could not disconnect provider.");
          providers[p === "eleven" ? "connected" : p] = false;
          state.audioEngine = "google";
          persist();
          return true;
        })();
      case "sync-cloud":
        return syncCloud(true);
      case "export-library": {
        const result = exportFile({ filename: "sona-library.json", mimeType: "application/json", content: JSON.stringify(state, null, 2) });
        notify("Library backup prepared.");
        return result;
      }
      case "import-backup":
        return importBackup(Array.isArray(c.file) ? c.file[0] : c.file);
      default:
        return false;
    }
  }
  const disconnect = controller.connect({ dispatch });
  if (env.speechSynthesis) {
    const changed = () => loadDevice();
    env.speechSynthesis.addEventListener?.("voiceschanged", changed);
    cleanups.push(() => env.speechSynthesis.removeEventListener?.("voiceschanged", changed));
    loadDevice();
  }
  const online = () => syncCloud(true), focus = () => cloudReady && !playing && syncCloud(true), unload = () => {
    persist();
    env.speechSynthesis?.cancel();
  };
  env.addEventListener?.("online", online);
  env.addEventListener?.("focus", focus);
  env.addEventListener?.("beforeunload", unload);
  cleanups.push(() => env.removeEventListener?.("online", online), () => env.removeEventListener?.("focus", focus), () => env.removeEventListener?.("beforeunload", unload));
  if (env.navigator?.mediaSession) try {
    env.navigator.mediaSession.setActionHandler("play", () => userPlay(current()?.position || 0));
    env.navigator.mediaSession.setActionHandler("pause", stop);
    env.navigator.mediaSession.setActionHandler("seekbackward", () => dispatch({ type: "skip", direction: -1 }));
    env.navigator.mediaSession.setActionHandler("seekforward", () => dispatch({ type: "skip", direction: 1 }));
  } catch {
  }
  publish();
  initCloud();
  Promise.allSettled([fetcher?.("/api/eleven/status"), fetcher?.("/api/tts/status")]).then(async (r) => {
    try {
      const values = await Promise.all(r.map((x) => x.status === "fulfilled" ? x.value.json() : {}));
      providers = { ...values[1], connected: !!values[0].connected };
      publish();
    } catch {
    }
  });
  return function dispose() {
    if (!alive) return;
    stop();
    alive = false;
    env.clearTimeout(timer);
    env.clearTimeout(syncTimer);
    for (const fn of cleanups) fn();
    if (env.navigator?.mediaSession) for (const action of ["play", "pause", "seekbackward", "seekforward"]) try {
      env.navigator.mediaSession.setActionHandler(action, null);
    } catch {
    }
    disconnect();
  };
}
export {
  startSonaEngine
};
