import test from 'node:test';import assert from 'node:assert/strict';import{classify,sentences,duration,clamp,escapeHTML,validArticle}from'../src/core.js';
test('assigns recognizable motif families from article content',()=>{assert.equal(classify('Software and computer algorithms in digital technology'),'technology');assert.equal(classify('A helping hand: kindness, compassion and care'),'care');assert.equal(classify('A mountain ridge and forest landscape'),'landscape');assert.equal(classify('Attention and mindful growth'),'growth')});
test('sentence positions survive punctuation and final unpunctuated text',()=>{assert.deepEqual(sentences('One thing. Another thing! A final thought'),['One thing.','Another thing!','A final thought']);assert.equal(sentences('Hello?\nWorld.').length,2)});
test('seek clamps to article bounds',()=>{assert.equal(clamp(-10,0,8),0);assert.equal(clamp(20,0,8),8)});
test('imported titles cannot inject markup',()=>assert.equal(escapeHTML('<img src=x onerror="alert(1)">'),'&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
test('rejects invalid backups and empty content',()=>{assert.equal(validArticle({title:'x',text:' '}),false);assert.equal(validArticle({title:'x',text:'Hello.'}),true)});
test('duration respects playback speed',()=>{const text=Array(620).fill('word').join(' ');assert.equal(duration(text),4);assert.equal(duration(text,2),2)});
