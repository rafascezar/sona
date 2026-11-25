import {classify,validArticle} from './core.js';

const MAX_FILE_SIZE=15*1024*1024;
const MAX_TEXT_LENGTH=150000;
const MAX_TITLE_LENGTH=250;
const PDF_MODULE_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.mjs';
const PDF_WORKER_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.394/build/pdf.worker.mjs';

function finish(data){
  const title=String(data?.title||'').trim().slice(0,MAX_TITLE_LENGTH);
  const text=String(data?.text||'').trim();
  if(!validArticle({title,text}))throw new Error('No readable text was found.');
  if(text.length>MAX_TEXT_LENGTH)throw new Error('This article is too long. Please split it into smaller sections.');
  const preview={...data,title,text,source:String(data?.source||'').trim()||'Your library'};
  if(typeof preview.author==='string')preview.author=preview.author.trim();
  preview.theme=classify(`${title} ${text}`);
  return preview;
}

async function readPdf(file,loadPdf){
  const pdfjs=typeof loadPdf==='function'?await loadPdf():loadPdf||await import(PDF_MODULE_URL);
  if(!pdfjs?.getDocument)throw new Error('PDF support could not be loaded. Try again or use Paste text.');
  if(pdfjs.GlobalWorkerOptions)pdfjs.GlobalWorkerOptions.workerSrc=PDF_WORKER_URL;
  const loadingTask=pdfjs.getDocument({data:await file.arrayBuffer()});
  let pdf;
  try{
    pdf=await loadingTask.promise;
    const pages=[];
    for(let number=1;number<=pdf.numPages;number++){
      const page=await pdf.getPage(number);
      try{
        const content=await page.getTextContent();
        pages.push(content.items.map(item=>item?.str||'').join(' '));
      }finally{
        page.cleanup?.();
      }
    }
    const text=pages.join('\n\n').trim();
    if(text.length<30)throw new Error('This PDF may be a scanned image. Copy its text with OCR and use Paste text.');
    return text;
  }finally{
    if(pdf?.destroy)await pdf.destroy();
    else await loadingTask.destroy?.();
  }
}

async function readHtml(file,Parser){
  if(typeof Parser!=='function')throw new Error('HTML import is not supported in this browser. Try Paste text.');
  const document=new Parser().parseFromString(await file.text(),'text/html');
  document.querySelectorAll('script,style,nav,header,footer').forEach(node=>node.remove());
  return String((document.querySelector('article,main')||document.body)?.textContent||'').trim();
}

export async function prepareArticleImport(command,{fetch:fetchImpl=globalThis.fetch,DOMParser:Parser=globalThis.DOMParser,loadPdf}={}){
  const mode=command?.mode;
  if(mode==='url'){
    if(typeof fetchImpl!=='function')throw new Error('Could not load article.');
    const response=await fetchImpl('/api/import',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({url:String(command.url||'')}),
    });
    const data=await response.json();
    if(!response.ok)throw new Error(data?.error||'Could not load article.');
    return finish(data);
  }

  if(mode==='text'){
    const text=String(command.text||'').trim();
    if(!text)throw new Error('Add some text first.');
    return finish({title:String(command.title||'').trim(),text,source:'Your words',author:''});
  }

  if(mode==='file'){
    const file=Array.isArray(command.file)?command.file[0]:command.file;
    if(!file)throw new Error('Choose a file first.');
    if(file.size>MAX_FILE_SIZE)throw new Error('Please choose a file smaller than 15 MB.');
    const name=String(file.name||'');
    let text;
    if(/\.pdf$/i.test(name))text=await readPdf(file,loadPdf);
    else if(/\.html?$/i.test(name))text=await readHtml(file,Parser);
    else if(/\.(?:txt|md|markdown)$/i.test(name))text=String(await file.text()).trim();
    else throw new Error('This file type is not supported. Choose a PDF, TXT, Markdown, or HTML file.');
    return finish({title:name.replace(/\.[^.]+$/,'').slice(0,MAX_TITLE_LENGTH),text,source:'Your files',author:''});
  }

  throw new Error('Choose how you want to add this article.');
}
