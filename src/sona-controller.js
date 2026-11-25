const INITIAL_SNAPSHOT=Object.freeze({
  ready:false,view:'library',query:'',filter:'all',importMode:'url',currentId:null,
  articles:Object.freeze([]),queue:Object.freeze([]),
  playback:Object.freeze({playing:false,rate:1,engine:'google',readMode:false}),
  cloudStatus:'Connecting to cloud…',
});

function freezeSnapshot(value){
  if(Array.isArray(value))return Object.freeze(value.map(freezeSnapshot));
  if(value&&typeof value==='object'){
    const copy={};
    for(const [key,item] of Object.entries(value))copy[key]=freezeSnapshot(item);
    return Object.freeze(copy);
  }
  return value;
}

export function createSonaController(){
  let snapshot=INITIAL_SNAPSHOT;
  let engine=null;
  let pendingNavigation=null;
  const listeners=new Set();
  return Object.freeze({
    getSnapshot:()=>snapshot,
    subscribe(listener){
      if(typeof listener!=='function')throw new TypeError('A listener function is required.');
      listeners.add(listener);
      return()=>listeners.delete(listener);
    },
    dispatch(command){
      if(!command||typeof command.type!=='string')return false;
      const safeCommand=Object.freeze({...command});
      if(!engine){
        if(safeCommand.type==='navigate'&&typeof safeCommand.view==='string'){
          pendingNavigation=safeCommand;
          return true;
        }
        return false;
      }
      return engine.dispatch(safeCommand);
    },
    connect(nextEngine){
      if(!nextEngine||typeof nextEngine.dispatch!=='function')throw new TypeError('A Sona engine with dispatch is required.');
      if(engine)throw new Error('A Sona engine is already connected.');
      engine=nextEngine;
      if(pendingNavigation){
        const command=pendingNavigation;
        pendingNavigation=null;
        engine.dispatch(command);
      }
      return()=>{if(engine===nextEngine)engine=null};
    },
    publish(nextSnapshot){
      snapshot=freezeSnapshot({...INITIAL_SNAPSHOT,...nextSnapshot,ready:true});
      for(const listener of listeners)listener();
      return snapshot;
    },
  });
}

export const sonaController=createSonaController();
