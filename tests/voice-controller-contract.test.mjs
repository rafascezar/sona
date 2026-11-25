import assert from 'node:assert/strict';
import test from 'node:test';
import {assertVoiceController,normalizeVoiceSnapshot} from '../src/voices/voice-controller-contract.js';

test('voice snapshot keeps only the public UI contract',()=>{
  const snapshot=normalizeVoiceSnapshot({provider:'azure',apiKey:'must-not-leak',voices:[{id:'a',name:'Ava',language:'en-CA',secret:'hidden'},null],providers:{azure:{isConnected:true,status:'ready',key:'hidden'}}});
  assert.equal(snapshot.provider,'azure');
  assert.deepEqual(snapshot.voices,[{id:'a',name:'Ava',language:'en-CA',description:''}]);
  assert.equal(snapshot.providers.azure.isConnected,true);
  assert.ok(!JSON.stringify(snapshot).includes('must-not-leak'));
  assert.ok(!JSON.stringify(snapshot).includes('hidden'));
  assert.ok(Object.isFrozen(snapshot));
});

test('voice controller rejects incomplete integrations',()=>{
  assert.throws(()=>assertVoiceController({getSnapshot(){}}),/must implement/);
});
