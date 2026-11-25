import fs from 'node:fs/promises';
import {build} from 'esbuild';
const root=process.cwd();
const artPath='/workspace/generated_images/exec-50cfbd1c-47a0-4c5e-ac32-3cd96338385c.png';
let art;try{art=await fs.readFile(root+'/public/art/approved.png')}catch{art=await fs.readFile(artPath);await fs.mkdir(root+'/public/art',{recursive:true});await fs.writeFile(root+'/public/art/approved.png',art)}
const svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1536" height="1024" viewBox="0 0 1536 1024"><image width="1536" height="1024" href="data:image/png;base64,'+art.toString('base64')+'"/></svg>';
const app=await build({entryPoints:['src/main.jsx'],bundle:true,write:false,outdir:'out',format:'esm',minify:true,external:['https://*'],loader:{'.woff2':'dataurl'}});const appText=app.outputFiles.find(file=>file.path.endsWith('.js')).text;const astryxCss=app.outputFiles.find(file=>file.path.endsWith('.css'))?.text||'';
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
await build({entryPoints:['src/server.js'],bundle:true,format:'esm',target:'es2022',outfile:'dist/server/index.js',minify:true,plugins:[{name:'embedded',setup(b){b.onResolve({filter:/\?raw$/},a=>({path:a.path,namespace:'embedded'}));b.onLoad({filter:/.*/,namespace:'embedded'},async a=>({contents:a.path.includes('app.js')?appText:a.path.includes('style.css')?astryxCss+'\n'+await fs.readFile('src/style.css','utf8'):svg,loader:'text'}));b.onLoad({filter:/page\.html$/},async a=>({contents:await fs.readFile(a.path,'utf8'),loader:'text'}))}}]});await fs.copyFile('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built Sona Worker and embedded React/Astryx application assets.');
