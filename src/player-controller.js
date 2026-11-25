const DEFAULT_STATE={
  status:'idle',
  articleId:null,
  position:0,
  sentenceCount:0,
  rate:1,
  timerUntil:0,
  bookmarks:[],
};

function clamp(value,min,max){
  return Math.min(max,Math.max(min,value));
}

function freezeSnapshot(value){
  if(Array.isArray(value))return Object.freeze(value.map(freezeSnapshot));
  if(value&&typeof value==='object'){
    const copy={};
    for(const [key,item] of Object.entries(value))copy[key]=freezeSnapshot(item);
    return Object.freeze(copy);
  }
  return value;
}

function normalizeState(source={}){
  const sentenceCount=Math.max(0,Math.trunc(Number(source.sentenceCount)||0));
  const position=sentenceCount?clamp(Math.trunc(Number(source.position)||0),0,sentenceCount-1):0;
  const bookmarks=[...new Set((Array.isArray(source.bookmarks)?source.bookmarks:[])
    .map(Number).filter(Number.isInteger).filter(index=>index>=0&&index<sentenceCount))].sort((a,b)=>a-b);
  return {
    status:['idle','playing','paused'].includes(source.status)?source.status:'idle',
    articleId:typeof source.articleId==='string'?source.articleId:null,
    position,
    sentenceCount,
    rate:clamp(Number.isFinite(Number(source.rate))?Number(source.rate):1,.5,3),
    timerUntil:Math.max(0,Number(source.timerUntil)||0),
    bookmarks,
  };
}

/** Framework-neutral state controller for Sona's player UI.
 * Media resources remain the responsibility of the connected playback engine.
 */
export function createPlayerController(options={}){
  const now=options.now||Date.now;
  const schedule=options.setTimeout||globalThis.setTimeout;
  const cancel=options.clearTimeout||globalThis.clearTimeout;
  let state=normalizeState({...DEFAULT_STATE,...options.initialState});
  let snapshot=freezeSnapshot(state);
  let timerHandle=null;
  const listeners=new Set();

  function publish(patch){
    state=normalizeState({...state,...patch});
    snapshot=freezeSnapshot(state);
    for(const listener of listeners)listener();
    options.onChange?.(snapshot);
    return snapshot;
  }

  function clearTimerHandle(){
    if(timerHandle!==null)cancel(timerHandle);
    timerHandle=null;
  }

  function armTimer(deadline){
    clearTimerHandle();
    if(!deadline)return publish({timerUntil:0});
    const delay=Math.max(0,deadline-now());
    timerHandle=schedule(()=>{
      timerHandle=null;
      publish({status:'paused',timerUntil:0});
      options.onTimerEnd?.(snapshot);
    },delay);
    return publish({timerUntil:deadline});
  }

  return Object.freeze({
    getSnapshot:()=>snapshot,
    subscribe(listener){
      if(typeof listener!=='function')throw new TypeError('A listener function is required.');
      listeners.add(listener);
      return()=>listeners.delete(listener);
    },
    load(article){
      if(!article||typeof article.id!=='string')throw new TypeError('An article id is required.');
      return publish({
        articleId:article.id,
        sentenceCount:article.sentenceCount,
        position:article.position,
        bookmarks:article.bookmarks,
        status:'idle',
      });
    },
    play(){
      if(!state.articleId||!state.sentenceCount)return snapshot;
      return publish({status:'playing'});
    },
    pause(){
      if(state.status==='idle')return snapshot;
      return publish({status:'paused'});
    },
    toggle(){
      return state.status==='playing'?this.pause():this.play();
    },
    seek(position){
      if(!state.sentenceCount)return snapshot;
      return publish({position});
    },
    setRate(rate){
      const value=Number(rate);
      if(!Number.isFinite(value)||value<=0)throw new RangeError('Playback rate must be a positive number.');
      return publish({rate:value});
    },
    setTimer(minutes){
      const value=Number(minutes);
      if(!Number.isFinite(value)||value<0)throw new RangeError('Timer minutes must be zero or greater.');
      return armTimer(value?now()+value*60_000:0);
    },
    bookmark(){
      if(!state.articleId||!state.sentenceCount)return snapshot;
      if(state.bookmarks.includes(state.position))return snapshot;
      const next=publish({bookmarks:[...state.bookmarks,state.position]});
      options.onBookmark?.({articleId:state.articleId,position:state.position});
      return next;
    },
    destroy(){
      clearTimerHandle();
      listeners.clear();
    },
  });
}
