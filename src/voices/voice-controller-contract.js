export const VOICE_PROVIDERS=Object.freeze(['google','azure','eleven','device']);

export const EMPTY_VOICE_SNAPSHOT=Object.freeze({
  provider:'google',
  providers:Object.freeze({
    google:Object.freeze({isConnected:false,isViaLire:true,status:'idle'}),
    azure:Object.freeze({isConnected:false,isViaLire:false,status:'idle'}),
    eleven:Object.freeze({isConnected:false,isViaLire:false,status:'idle'}),
    device:Object.freeze({isConnected:true,isViaLire:false,status:'ready'}),
  }),
  voices:Object.freeze([]),
  selectedVoiceId:'',
  isLoading:false,
  error:'',
});

const statuses=new Set(['idle','loading','ready','error']);

export function normalizeVoiceSnapshot(value){
  const source=value&&typeof value==='object'?value:{};
  const provider=VOICE_PROVIDERS.includes(source.provider)?source.provider:'google';
  const providers=Object.fromEntries(VOICE_PROVIDERS.map(id=>{
    const candidate=source.providers?.[id]||{};
    return [id,Object.freeze({
      isConnected:id==='device'||candidate.isConnected===true,
      isViaLire:candidate.isViaLire===true,
      status:statuses.has(candidate.status)?candidate.status:'idle',
    })];
  }));
  const voices=Array.isArray(source.voices)?source.voices.flatMap(voice=>{
    if(!voice||typeof voice!=='object'||typeof voice.id!=='string'||typeof voice.name!=='string')return [];
    return [Object.freeze({
      id:voice.id,
      name:voice.name,
      language:typeof voice.language==='string'?voice.language:'',
      description:typeof voice.description==='string'?voice.description:'',
    })];
  }):[];
  return Object.freeze({
    provider,
    providers:Object.freeze(providers),
    voices:Object.freeze(voices),
    selectedVoiceId:typeof source.selectedVoiceId==='string'?source.selectedVoiceId:'',
    isLoading:source.isLoading===true,
    error:typeof source.error==='string'?source.error:'',
  });
}

export function assertVoiceController(controller){
  const required=['getSnapshot','subscribe','selectProvider','selectVoice','refresh','connect','disconnect'];
  if(!controller||required.some(method=>typeof controller[method]!=='function')){
    throw new TypeError(`Voice controller must implement: ${required.join(', ')}`);
  }
  return controller;
}

