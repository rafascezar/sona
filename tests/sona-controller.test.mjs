import test from 'node:test';
import assert from 'node:assert/strict';
import {createSonaController} from '../src/sona-controller.js';

test('controller publishes immutable serializable snapshots',()=>{
  const controller=createSonaController();
  const source={view:'player',articles:[{id:'a',title:'Quiet'}],playback:{playing:true,rate:1.25,engine:'device',readMode:false}};
  const snapshot=controller.publish(source);
  source.articles[0].title='Changed outside';
  assert.equal(snapshot.ready,true);
  assert.equal(snapshot.articles[0].title,'Quiet');
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.articles));
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)),snapshot);
});

test('controller subscriptions are deterministic and removable',()=>{
  const controller=createSonaController();
  let calls=0;
  const unsubscribe=controller.subscribe(()=>calls++);
  controller.publish({view:'library'});
  unsubscribe();
  controller.publish({view:'add'});
  assert.equal(calls,1);
});

test('controller validates commands and queues navigation until connection',()=>{
  const controller=createSonaController();
  assert.equal(controller.dispatch(null),false);
  assert.equal(controller.dispatch({type:'navigate',view:'add'}),true);
  let received;
  const disconnect=controller.connect({dispatch(command){received=command;return command.type==='navigate'}});
  assert.deepEqual(received,{type:'navigate',view:'add'});
  assert.equal(controller.dispatch({type:'navigate',view:'library'}),true);
  assert.ok(Object.isFrozen(received));
  disconnect();
  assert.equal(controller.dispatch({type:'navigate',view:'library'}),true);
});

test('controller rejects a second live engine',()=>{
  const controller=createSonaController();
  controller.connect({dispatch:()=>true});
  assert.throws(()=>controller.connect({dispatch:()=>true}),/already connected/);
});
