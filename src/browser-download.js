export function downloadText(env,text,filename,type='text/plain'){
  const document=env.document,URL=env.URL,Blob=env.Blob;
  if(!document||!URL?.createObjectURL||!Blob)return false;
  const url=URL.createObjectURL(new Blob([text],{type}));
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=String(filename).replace(/[\\/\u0000-\u001f]/g,'_');
  anchor.hidden=true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  env.setTimeout(()=>URL.revokeObjectURL(url),1000);
  return true;
}
