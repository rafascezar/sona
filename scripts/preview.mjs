import http from 'node:http';
import worker from '../dist/server/index.js';

// Local QA adapter only. Private cloud storage remains available on the hosted Site.
const server=http.createServer(async(inbound,outbound)=>{
  try{
    const chunks=[];
    for await(const chunk of inbound)chunks.push(chunk);
    const request=new Request(`http://${inbound.headers.host}${inbound.url}`,{
      method:inbound.method,
      headers:inbound.headers,
      ...(!['GET','HEAD'].includes(inbound.method)?{body:Buffer.concat(chunks)}:{}),
    });
    const response=await worker.fetch(request,{});
    outbound.writeHead(response.status,Object.fromEntries(response.headers));
    outbound.end(Buffer.from(await response.arrayBuffer()));
  }catch{outbound.writeHead(500);outbound.end('Preview request failed.');}
});
const portArgument=process.argv.indexOf('--port');
const port=Number(portArgument>=0?process.argv[portArgument+1]:process.env.PORT)||3000;
server.listen(port,'0.0.0.0',()=>console.log(`Sona preview listening on ${port}`));
