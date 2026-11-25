import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from 'linkedom';
import {prepareArticleImport} from '../src/article-import.js';

test('HTML import keeps readable article content and removes page chrome and scripts',async()=>{
  const html='<html><body><header>Site title</header><nav>Menu</nav><article><h1>Quiet systems</h1><p>The useful article body is long enough to become a reading.</p><script>steal()</script></article><footer>Links</footer></body></html>';
  const result=await prepareArticleImport({mode:'file',file:{name:'quiet.html',size:html.length,text:async()=>html}},{DOMParser});
  assert.equal(result.title,'quiet');
  assert.match(result.text,/Quiet systems/);
  assert.match(result.text,/useful article body/);
  assert.doesNotMatch(result.text,/Site title|Menu|steal|Links/);
});

test('PDF import joins text pages and releases parser resources',async()=>{
  let pageCleanups=0,destroys=0;
  const pages=[
    ['A thoughtful opening sentence','with enough readable detail.'],
    ['A second page continues','the same quiet article.'],
  ];
  const pdf={numPages:pages.length,getPage:async number=>({getTextContent:async()=>({items:pages[number-1].map(str=>({str}))}),cleanup:()=>pageCleanups++}),destroy:async()=>destroys++};
  const file={name:'reading.pdf',size:200,arrayBuffer:async()=>new ArrayBuffer(8)};
  const result=await prepareArticleImport({mode:'file',file},{loadPdf:{getDocument:()=>({promise:Promise.resolve(pdf)})}});
  assert.match(result.text,/thoughtful opening/);
  assert.match(result.text,/second page/);
  assert.equal(pageCleanups,2);
  assert.equal(destroys,1);
});

test('scanned PDF guidance is actionable and still destroys the document',async()=>{
  let destroyed=0;
  const pdf={numPages:1,getPage:async()=>({getTextContent:async()=>({items:[{str:'tiny'}]}),cleanup:()=>{}}),destroy:async()=>destroyed++};
  await assert.rejects(()=>prepareArticleImport({mode:'file',file:{name:'scan.pdf',size:50,arrayBuffer:async()=>new ArrayBuffer(2)}},{loadPdf:{getDocument:()=>({promise:Promise.resolve(pdf)})}}),/scanned image.*OCR.*Paste text/i);
  assert.equal(destroyed,1);
});

test('oversized and unsupported files are rejected before reading bytes',async()=>{
  let reads=0;
  const oversized={name:'large.md',size:15*1024*1024+1,text:async()=>{reads++;return 'content'}};
  await assert.rejects(()=>prepareArticleImport({mode:'file',file:oversized}),/smaller than 15 MB/i);
  await assert.rejects(()=>prepareArticleImport({mode:'file',file:{name:'archive.zip',size:20,text:async()=>{reads++;return 'content'}}}),/file type is not supported/i);
  assert.equal(reads,0);
});
