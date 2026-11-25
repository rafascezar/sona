import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../dist/server/index.js';

const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));

test('worker serves the versioned app, bundled style and approved artwork',async()=>{
  for(const [path,type] of [['/','text/html'],['/app.js','text/javascript'],['/style.css','text/css'],['/art.svg','image/svg+xml']]){
    const response=await worker.fetch(new Request('https://sona.test'+path));
    assert.equal(response.status,200);
    assert.ok(response.headers.get('content-type').includes(type));
    const body=await response.text();
    assert.ok(body.length>100);
    if(path==='/')assert.ok(body.includes(`Sona v${version}`));
  }
});

test('production bundle contains React/Astryx without the removed legacy mount',async()=>{
  const html=await(await worker.fetch(new Request('https://sona.test/'))).text();
  const script=await(await worker.fetch(new Request('https://sona.test/app.js'))).text();
  const style=await(await worker.fetch(new Request('https://sona.test/style.css'))).text();
  assert.match(html,/id="root"/);
  assert.match(script,/useSyncExternalStore/);
  assert.doesNotMatch(script,/sona:navigate/);
  assert.match(script,/Your library/);
  assert.match(style,/astryx-base|--color-background/);
});

test('URL importer rejects private targets and invalid origins',async()=>{
  for(const url of ['http://127.0.0.1/x','http://192.168.1.1/x','file:///etc/passwd','http://localhost/x','http://[::1]/']){
    const response=await worker.fetch(new Request('https://sona.test/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}));
    assert.equal(response.status,400);
  }
  const response=await worker.fetch(new Request('https://sona.test/api/import',{method:'POST',headers:{origin:'https://evil.test'},body:'{}'}));
  assert.equal(response.status,403);
});

test('URL importer extracts readable text and title from real HTML structure',async()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=async()=>new Response('<html><head><title>A quiet afternoon</title></head><body><nav>Menu</nav><article><h1>A quiet afternoon</h1>'+Array(8).fill('<p>Attention is a kind of generosity. We can make space for what matters by listening, noticing, and learning to move through our days with a little more intention.</p>').join('')+'</article></body></html>',{headers:{'Content-Type':'text/html'}});
  try{
    const response=await worker.fetch(new Request('https://sona.test/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:'https://example.com/article'})}));
    const data=await response.json();
    assert.equal(response.status,200,JSON.stringify(data));
    assert.match(data.title,/quiet afternoon/);
    assert.ok(data.text.length>200);
    assert.ok(!data.text.includes('Menu'));
  }finally{globalThis.fetch=saved}
});
