import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {build} from 'esbuild';

async function productionApp({wide=false}={}){
  const {document,window}=parseHTML('<!doctype html><html><head></head><body><div id="root"></div></body></html>');
  document.hasFocus=()=>true;
  const memory=new Map();
  const localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
  const speechSynthesis={getVoices:()=>[],cancel:()=>{},speak:()=>{},addEventListener:()=>{},removeEventListener:()=>{}};
  const raf=callback=>{const timer=setTimeout(()=>callback(Date.now()),0);timer.unref?.();return timer};
  const CSS={supports:()=>false,escape:value=>String(value)};
  window.matchMedia=query=>({matches:query.includes('min-width: 64rem')&&wide,media:query,addEventListener(){},removeEventListener(){}});
  Object.assign(window,{CSS,speechSynthesis,scrollTo:()=>{},fetch:async()=>Response.json({error:'Unavailable'},{status:503}),requestAnimationFrame:raf,cancelAnimationFrame:clearTimeout,getComputedStyle:()=>({direction:'ltr',writingMode:'horizontal-tb',overflowX:'visible',overflowY:'visible'})});
  Object.assign(window.navigator,{mediaSession:{setActionHandler:()=>{}},userAgent:'node'});
  const context={
    window,document,navigator:window.navigator,location:window.location,localStorage,
    CustomEvent:window.CustomEvent,Event:window.Event,Node:window.Node,Element:window.Element,
    HTMLElement:window.HTMLElement,HTMLIFrameElement:window.HTMLIFrameElement,
    MutationObserver:window.MutationObserver,CSS,getComputedStyle:()=>({direction:'ltr',writingMode:'horizontal-tb',overflowX:'visible',overflowY:'visible'}),
    requestAnimationFrame:raf,cancelAnimationFrame:clearTimeout,
    SpeechSynthesisUtterance:class{constructor(text){this.text=text}},Audio:class{},MediaMetadata:class{constructor(data){Object.assign(this,data)}},
    Blob,URL,Response,Request,Headers,AbortController,crypto:globalThis.crypto,performance,
    console,
    setTimeout:(callback,delay,...args)=>{const timer=setTimeout(callback,delay,...args);timer.unref?.();return timer},clearTimeout,
    setInterval:(callback,delay,...args)=>{const timer=setInterval(callback,delay,...args);timer.unref?.();return timer},clearInterval,
    queueMicrotask,TextEncoder,TextDecoder
  };
  window.window=window;window.self=window;window.globalThis=window;
  const result=await build({
    stdin:{contents:"import('./src/main.jsx')",resolveDir:process.cwd(),sourcefile:'production-test-entry.js'},
    bundle:true,write:false,format:'iife',platform:'browser',target:'es2022',
    external:['https://*'],logLevel:'silent',
    plugins:[{
      name:'dom-test-entry',
      setup(buildApi){
        buildApi.onResolve({filter:/\.css$/},args=>({path:args.path,namespace:'empty-style'}));
        buildApi.onLoad({filter:/.*/,namespace:'empty-style'},()=>({contents:'',loader:'js'}));
      }
    }]
  });
  vm.runInNewContext(result.outputFiles[0].text,context);
  for(let i=0;i<8;i++)await new Promise(resolve=>setTimeout(resolve,0));
  return {document,window,memory};
}

test('production entry mounts the React and Astryx navigation shell',async()=>{
  const {document}=await productionApp();
  assert.equal(document.querySelectorAll('#root').length,1);
  assert.equal(document.querySelector('#app'),null,'the removed legacy mount must not return');
  assert.match(document.body.textContent,/Sona/);
  assert.match(document.body.textContent,/Your library/);
  assert.match(document.body.textContent,/Your reading, with room to breathe/);
  assert.match(document.body.textContent,/Bring your own/);
});

test('production React shell and engine-driven views stay synchronized',async()=>{
  const {document,window}=await productionApp();
  const item=label=>[...document.querySelectorAll('button,a')].find(node=>node.textContent.trim()===label);
  const add=item('Add an article');
  assert.ok(add,'React navigation should expose Add an article');
  add.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(document.querySelector('form'));
  assert.ok(document.querySelector('input[type="url"]'),'URL import remains labelled and available');

  item('Listening queue').dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  const queue=item('Listening queue');
  assert.ok(queue);
  assert.equal(queue.getAttribute('aria-current'),'page');

  item('Voices').dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(document.body.textContent,/Voices|narrator/i);
  assert.equal(item('Voices').getAttribute('aria-current'),'page');
});

for(const wide of [false,true])test(`player has named controls and one main heading with ${wide?'wide':'narrow'} breakpoint`,async()=>{
  const {document,window}=await productionApp({wide});
  const click=label=>{
    const control=[...document.querySelectorAll('button')].find(node=>node.textContent.trim()===label||node.getAttribute('aria-label')===label);
    assert.ok(control,`Missing ${label}`);
    control.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
    return control;
  };
  click('Open player');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(document.querySelectorAll('main,[role="main"]').length,1);
  assert.equal(document.querySelectorAll('h1').length,1);
  assert.match(document.querySelector('h1').textContent,/The art of paying attention/);
  assert.equal(document.querySelector('h1').tabIndex,-1,'Page title can receive route-change focus');
  const transport=document.querySelector('section[aria-label="Playback controls"]');
  assert.ok(transport);
  assert.equal(transport.querySelectorAll('button').length,3);
  assert.ok(transport.querySelector('button[aria-label="Back 15 seconds"]'));
  assert.ok(transport.querySelector('button[aria-label="Forward 15 seconds"]'));
  assert.ok(document.querySelector('[role="slider"][aria-label="Article position"]')||document.querySelector('[role="slider"][aria-labelledby]'));
  click('Bookmark');
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(document.querySelector('button[aria-pressed="true"]'),'Bookmark state is announced independently of color');
  assert.ok(document.querySelector('button[aria-expanded="false"]'),'Saved passages remain collapsible');
});
