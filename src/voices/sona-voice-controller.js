import {sonaController} from '../sona-controller.js';

let source;
let snapshot;
function getSnapshot(){
  const next=sonaController.getSnapshot();
  if(next!==source){source=next;snapshot=next.voice;}
  return snapshot;
}

const send=(type,payload={})=>Promise.resolve(sonaController.dispatch({type,...payload}));

export const sonaVoiceController=Object.freeze({
  getSnapshot,
  subscribe:sonaController.subscribe,
  selectProvider:provider=>send('voice-select-provider',{provider}),
  selectVoice:voiceId=>send('voice-select',{voiceId}),
  refresh:()=>send('voice-refresh'),
  connect:credentials=>send('voice-connect',credentials),
  disconnect:provider=>send('voice-disconnect',{provider}),
});
