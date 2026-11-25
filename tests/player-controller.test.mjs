import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayerController} from '../src/player-controller.js';

test('player controller exposes immutable serializable snapshots',()=>{
  const controller=createPlayerController();
  controller.load({id:'quiet',sentenceCount:4,position:1,bookmarks:[0]});
  const snapshot=controller.getSnapshot();
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.bookmarks));
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)),snapshot);
  assert.equal(snapshot.articleId,'quiet');
});

test('play, pause, seek and rate transitions are controlled and clamped',()=>{
  const controller=createPlayerController();
  assert.equal(controller.play().status,'idle');
  controller.load({id:'a',sentenceCount:3});
  assert.equal(controller.play().status,'playing');
  assert.equal(controller.seek(99).position,2);
  assert.equal(controller.setRate(1.75).rate,1.75);
  assert.equal(controller.pause().status,'paused');
  assert.equal(controller.toggle().status,'playing');
  assert.throws(()=>controller.setRate(0),RangeError);
});

test('bookmark is idempotent and reports the article boundary',()=>{
  const saved=[];
  const controller=createPlayerController({onBookmark:value=>saved.push(value)});
  controller.load({id:'a',sentenceCount:5,position:2,bookmarks:[1]});
  controller.bookmark();
  controller.bookmark();
  assert.deepEqual(controller.getSnapshot().bookmarks,[1,2]);
  assert.deepEqual(saved,[{articleId:'a',position:2}]);
});

test('sleep timer replaces prior work, pauses once, and can be disabled',()=>{
  let clock=1_000,nextId=0;
  const jobs=new Map();
  const ended=[];
  const controller=createPlayerController({
    now:()=>clock,
    setTimeout:(fn,delay)=>{const id=++nextId;jobs.set(id,{fn,delay});return id},
    clearTimeout:id=>jobs.delete(id),
    onTimerEnd:snapshot=>ended.push(snapshot.status),
  });
  controller.load({id:'a',sentenceCount:2});
  controller.play();
  assert.equal(controller.setTimer(15).timerUntil,901_000);
  controller.setTimer(30);
  assert.equal(jobs.size,1);
  const [[jobId,{fn,delay}]]=jobs.entries();
  assert.equal(delay,1_800_000);
  jobs.delete(jobId);clock+=delay;fn();
  assert.equal(controller.getSnapshot().status,'paused');
  assert.equal(controller.getSnapshot().timerUntil,0);
  assert.deepEqual(ended,['paused']);
  controller.setTimer(10);
  controller.setTimer(0);
  assert.equal(jobs.size,0);
});

test('subscriptions are removable and destroy cancels resources',()=>{
  let calls=0,cancelled=0;
  const controller=createPlayerController({setTimeout:()=>7,clearTimeout:()=>cancelled++});
  const unsubscribe=controller.subscribe(()=>calls++);
  controller.load({id:'a',sentenceCount:1});
  unsubscribe();
  controller.play();
  controller.setTimer(1);
  controller.destroy();
  assert.equal(calls,1);
  assert.equal(cancelled,1);
});
