import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {build} from 'esbuild';

async function productionApp(){
  const {document,window}=parseHTML('<!doctype html><html><head></head><body><div id="root"></div></body></html>');
  const memory=new Map();
  const localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
  const speechSynthesis={getVoices:()=>[],cancel:()=>{},speak:()=>{},addEventListener:()=>{},removeEventListener:()=>{}};
  const raf=callback=>{const timer=setTimeout(()=>callback(Date.now()),0);timer.unref?.();return timer};
  Object.assign(window,{speechSynthesis,scrollTo:()=>{},fetch:async()=>Response.json({error:'Unavailable'},{status:503}),requestAnimationFrame:raf,cancelAnimationFrame:clearTimeout,getComputedStyle:()=>({direction:'ltr',writingMode:'horizontal-tb',overflowX:'visible',overflowY:'visible'})});
  Object.assign(window.navigator,{mediaSession:{setActionHandler:()=>{}},userAgent:'node'});
  const context={
    window,document,navigator:window.navigator,location:window.location,localStorage,
    CustomEvent:window.CustomEvent,Event:window.Event,Node:window.Node,Element:window.Element,
    HTMLElement:window.HTMLElement,HTMLIFrameElement:window.HTMLIFrameElement,
    MutationObserver:window.MutationObserver,getComputedStyle:()=>({direction:'ltr',writingMode:'horizontal-tb',overflowX:'visible',overflowY:'visible'}),
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
        buildApi.onLoad({filter:/src\/main\.jsx$/},async args=>{
          const source=await import('node:fs/promises').then(fs=>fs.readFile(args.path,'utf8'));
          return {contents:source.replace("await import('./app.js');","import('./app.js');"),loader:'jsx'};
        });
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
  assert.equal(document.querySelectorAll('[data-ui-system="astryx"]').length,1);
  assert.equal(document.querySelector('[data-ui-system="astryx"]').dataset.migrationPhase,'controller');
  assert.match(document.body.textContent,/Sona/);
  assert.match(document.body.textContent,/Your library/);
  assert.match(document.querySelector('#app').textContent,/Something worth/);
});

test('production React shell and legacy view stay synchronized in both directions',async()=>{
  const {document,window}=await productionApp();
  const item=label=>[...document.querySelectorAll('button,a')].find(node=>node.textContent.trim()===label);
  const add=item('Add an article');
  assert.ok(add,'React navigation should expose Add an article');
  add.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.ok(document.querySelector('#import-form'));

  item('Listening queue').dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  const queue=item('Listening queue');
  assert.ok(queue);
  assert.equal(queue.getAttribute('aria-current'),'page');

  item('Voices').dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(document.querySelector('#app').textContent,/Voices|narrator/i);
  assert.equal(item('Voices').getAttribute('aria-current'),'page');
});
