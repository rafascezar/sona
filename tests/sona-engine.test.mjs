import test from 'node:test';
import assert from 'node:assert/strict';
import {startSonaEngine} from '../src/sona-engine.js';
import {createSonaController} from '../src/sona-controller.js';

const article=(overrides={})=>({id:'old',title:'A saved article',text:'First sentence. Second sentence.',...overrides});
const response=(data,status=200)=>Response.json(data,{status});

function harness({saved,fetch:fetchOverride,Audio}={}){
  const memory=new Map(saved===undefined?[]:[['sona.v1',JSON.stringify(saved)]]);
  const storage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value))};
  const controller=createSonaController();
  const handlers=new Map();
  const timers=new Set();
  const env={
    localStorage:storage,crypto:{randomUUID:()=>`generated-${Math.random()}`},navigator:{onLine:true,mediaSession:{setActionHandler:(name,fn)=>handlers.set(name,fn),setPositionState:value=>handlers.set('position',value)}},
    location:{origin:'https://sona.test'},speechSynthesis:{getVoices:()=>[],cancel:()=>{},addEventListener:()=>{},removeEventListener:()=>{}},
    SpeechSynthesisUtterance:class{},MediaMetadata:class{constructor(value){Object.assign(this,value)}},Audio,
    addEventListener:()=>{},removeEventListener:()=>{},
    setTimeout:(fn,delay)=>{const id={fn,delay};timers.add(id);return id},clearTimeout:id=>timers.delete(id),
    fetch:fetchOverride||((url,options={})=>{
      if(url==='/api/cloud/library'&&(!options.method||options.method==='GET'))return response({state:null,revision:null});
      if(url==='/api/cloud/library'&&options.method==='PUT')return response({revision:'r1'});
      if(url==='/api/eleven/status')return response({connected:false});
      if(url==='/api/tts/status')return response({google:true,azure:false});
      if(String(url).startsWith('/api/tts/voices'))return response({voices:[{id:'voice',name:'Voice'}]});
      return response({error:'unexpected '+url},404);
    })
  };
  const dispose=startSonaEngine({controller,env,storage,fetch:env.fetch,now:()=>1000});
  return {controller,env,memory,dispose,handlers,timers};
}

const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
const until=async predicate=>{for(let i=0;i<30;i++){if(predicate())return true;await new Promise(resolve=>setImmediate(resolve))}return false};

test('old storage fixtures are normalized and public snapshots never expose credentials',async()=>{
  const saved={articles:[article({position:undefined,bookmarks:undefined,updatedAt:12})],queue:[],currentId:'old',providerKey:'server-secret',audioEngine:'device'};
  const h=harness({saved});
  await settle();
  const snapshot=h.controller.getSnapshot();
  assert.equal(snapshot.currentArticle.position,0);
  assert.deepEqual(snapshot.currentArticle.bookmarks,[]);
  assert.doesNotMatch(JSON.stringify(snapshot),/server-secret|providerKey|apiKey|credential/i);
  assert.doesNotThrow(()=>JSON.stringify(snapshot));
  h.dispose();
});

test('text import save, queue and delete preserve timestamps and tombstones',async()=>{
  const h=harness({saved:{articles:[article()],queue:[],currentId:'old',audioEngine:'device',deleted:{}}});
  await h.controller.dispatch({type:'submit-import',mode:'text',title:'New thought',text:'A useful first sentence. A useful second sentence.'});
  assert.equal(h.controller.getSnapshot().preview.title,'New thought');
  assert.equal(h.controller.dispatch({type:'save-preview'}),true);
  const created=h.controller.getSnapshot().articles.find(item=>item.title==='New thought');
  assert.ok(created);
  assert.equal(h.controller.dispatch({type:'article-action',action:'enqueue',id:created.id}),true);
  assert.deepEqual(h.controller.getSnapshot().queue,[created.id]);
  h.controller.dispatch({type:'article-action',action:'remove',id:created.id});
  assert.equal(h.controller.dispatch({type:'confirm-remove',articleId:created.id}),true);
  const backup=h.controller.dispatch({type:'export-library'});
  const state=JSON.parse(backup.content);
  assert.ok(!state.articles.some(item=>item.id===created.id));
  assert.equal(state.queue.includes(created.id),false);
  assert.equal(typeof state.deleted[created.id],'number');
  assert.equal(typeof state.updatedAt,'number');
  h.dispose();
});

test('oversized backup is rejected before reading or mutating library state',async()=>{
  const h=harness({saved:{articles:[article()],queue:[],currentId:'old',audioEngine:'device',deleted:{}}});
  let reads=0;
  const before=h.controller.getSnapshot().articles.map(item=>item.id);
  await h.controller.dispatch({type:'import-backup',file:{name:'large.json',size:15*1024*1024+1,text:async()=>{reads++;return '{}'}}});
  assert.equal(reads,0);
  assert.deepEqual(h.controller.getSnapshot().articles.map(item=>item.id),before);
  assert.match(h.controller.getSnapshot().notice.message,/smaller than 15 MB/i);
  h.dispose();
});

test('cloud conflicts retry after merging newest progress and remote tombstones',async()=>{
  let puts=0;
  const remote={articles:[article({position:1,updatedAt:200})],queue:[],currentId:'old',audioEngine:'device',deleted:{gone:300},updatedAt:200};
  const fetcher=(url,options={})=>{
    if(url==='/api/cloud/library'&&(!options.method||options.method==='GET'))return response({state:remote,revision:'remote-1'});
    if(url==='/api/cloud/library'&&options.method==='PUT'){
      puts++;
      return puts===1?response({state:remote,revision:'remote-2'},409):response({revision:'saved-3'});
    }
    if(url==='/api/eleven/status')return response({connected:false});
    if(url==='/api/tts/status')return response({google:false,azure:false});
    return response({},404);
  };
  const local={articles:[article({position:0,updatedAt:100})],queue:[],currentId:'old',audioEngine:'device',deleted:{},updatedAt:100};
  const h=harness({saved:local,fetch:fetcher});
  assert.equal(await until(()=>puts===2),true);
  const backup=JSON.parse(h.controller.dispatch({type:'export-library'}).content);
  assert.equal(backup.articles.find(item=>item.id==='old').position,1);
  assert.equal(backup.deleted.gone,300);
  assert.match(h.controller.getSnapshot().cloudStatus,/Cloud saved/);
  h.dispose();
});

test('premium playback keeps the synchronous iOS audio prime alive and aborts stale work',async()=>{
  const operations=[];
  let prepareSignal;
  let resolvePrepare;
  class AudioMock{
    constructor(){this.src='';this.playbackRate=1;this.playsInline=false}
    play(){operations.push(['play',this.src]);return Promise.resolve()}
    pause(){operations.push(['pause',this.src])}
    removeAttribute(name){operations.push(['remove',name,this.src]);if(name==='src')this.src=''}
    load(){operations.push(['load',this.src])}
  }
  const fetcher=(url,options={})=>{
    if(url==='/api/cloud/library'&&(!options.method||options.method==='GET'))return response({state:null,revision:null});
    if(url==='/api/cloud/library'&&options.method==='PUT')return response({revision:'r1'});
    if(url==='/api/eleven/status')return response({connected:false});
    if(url==='/api/tts/status')return response({google:true,azure:false});
    if(String(url).startsWith('/api/tts/voices'))return response({voices:[{id:'voice',name:'Voice'}]});
    if(url==='/api/tts/prepare'){
      prepareSignal=options.signal;
      return new Promise(resolve=>{resolvePrepare=resolve});
    }
    return response({},404);
  };
  const h=harness({saved:{articles:[article()],queue:[],currentId:'old',audioEngine:'google',deleted:{}},fetch:fetcher,Audio:AudioMock});
  await settle();
  assert.equal(h.controller.dispatch({type:'toggle-playback'}),true);
  assert.match(operations[0][1],/^data:audio\/wav;base64,/);
  assert.equal(operations.some(([name])=>name==='pause'),false,'premium startup must not immediately tear down the gesture-unlocked audio element');
  assert.equal(await until(()=>prepareSignal!==undefined),true,h.controller.getSnapshot().notice?.message||'premium preparation did not start');
  assert.equal(h.controller.dispatch({type:'toggle-playback'}),true);
  assert.equal(prepareSignal.aborted,true);
  resolvePrepare(response({url:'/late.mp3',start:0,end:1,total:2}));
  await settle();
  assert.equal(operations.some(([,src])=>src==='/late.mp3'),false,'an aborted token must not attach or play stale audio');
  h.dispose();
});

async function playbackHarness(){
  let audio,prepares=0;
  const operations=[];
  class AudioMock{
    constructor(){audio=this;this.currentTime=0;this.duration=40;this.ended=false;this.playbackRate=1;}
    set src(value){this.source=value;this.currentTime=0;}
    get src(){return this.source;}
    play(){operations.push(['play',this.src]);if(!this.src.startsWith('data:')){this.onloadedmetadata?.();this.onplaying?.();}return Promise.resolve();}
    pause(){operations.push(['pause',this.src]);}
    removeAttribute(){operations.push(['remove',this.src]);this.source='';}
    load(){}
  }
  const fetcher=(url,options={})=>{
    if(url==='/api/cloud/library')return response(options.method==='PUT'?{revision:'r1'}:{state:null,revision:null});
    if(url==='/api/tts/status')return response({google:true});
    if(url==='/api/eleven/status')return response({connected:false});
    if(String(url).startsWith('/api/tts/voices'))return response({voices:[{id:'voice',name:'Voice'}]});
    if(url==='/api/tts/prepare'){prepares++;const {start}=JSON.parse(options.body);return response({url:`/chunk-${start}.mp3`,start,end:Math.min(4,start+2),total:4});}
    return response({},404);
  };
  const h=harness({saved:{articles:[article({text:'A first sentence. A second sentence. A third sentence. A fourth sentence.'})],queue:[],currentId:'old',audioEngine:'google',deleted:{}},fetch:fetcher,Audio:AudioMock});
  h.controller.dispatch({type:'toggle-playback'});
  assert.equal(await until(()=>operations.some(([name,src])=>name==='play'&&src==='/chunk-0.mp3')),true);
  return {...h,audio,operations,prepares:()=>prepares};
}

test('lock-screen skip uses media seconds, honors seekOffset and retains the loaded source',async()=>{
  const h=await playbackHarness();
  const removed=h.operations.filter(([name])=>name==='remove').length;
  h.audio.currentTime=24;
  h.handlers.get('seekbackward')({seekOffset:15});
  assert.equal(h.audio.currentTime,9);
  h.handlers.get('seekforward')({seekOffset:7});
  assert.equal(h.audio.currentTime,16);
  h.controller.dispatch({type:'skip',direction:1});
  assert.equal(h.audio.currentTime,31);
  assert.equal(h.prepares(),1);
  assert.equal(h.operations.filter(([name])=>name==='remove').length,removed);
  assert.equal(h.handlers.get('position').position,31);
  h.handlers.get('pause')();
  const plays=h.operations.filter(([name])=>name==='play').length;
  h.handlers.get('seekbackward')({});
  assert.equal(h.audio.currentTime,16);
  assert.equal(h.controller.getSnapshot().playback.playing,false);
  assert.equal(h.operations.filter(([name])=>name==='play').length,plays);
  await h.handlers.get('play')();
  assert.equal(h.audio.currentTime,16);
  assert.equal(h.prepares(),1);
  h.dispose();
});

test('backward skip across a chunk boundary reuses the previous audio at its precise offset',async()=>{
  const h=await playbackHarness();
  h.audio.currentTime=40;h.audio.onended();
  assert.equal(await until(()=>h.audio.src==='/chunk-2.mp3'),true);
  h.audio.currentTime=8;
  h.handlers.get('seekbackward')({seekOffset:15});
  assert.equal(await until(()=>h.audio.src==='/chunk-0.mp3'),true);
  assert.equal(h.audio.currentTime,33);
  assert.equal(h.prepares(),2,'cached previous chunk should not synthesize again');
  assert.equal(h.controller.getSnapshot().playback.playing,true);
  h.handlers.get('seekto')({seekTime:12});
  assert.equal(h.audio.currentTime,12);
  h.dispose();
  assert.equal(h.handlers.get('seekto'),null);
});
