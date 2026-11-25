import React from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Section} from '@astryxdesign/core/Section';
import {SegmentedControl,SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Slider} from '@astryxdesign/core/Slider';
import {Stack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';

export function PlayerView({snapshot,dispatch}){
  const article=snapshot.currentArticle;
  if(!article)return null;
  const {playback={}}=snapshot;
  return <Section variant="transparent" padding={6}>
    <Stack gap={6} maxWidth="72rem">
      <Stack gap={2}>
        <Text type="label" color="accent">YOUR LISTENING SPACE</Text>
        <Heading level={1} type="display-2" textWrap="balance">{article.title}</Heading>
        <Text color="secondary">{article.author||article.source} · {article.duration} min listen</Text>
      </Stack>
      <SegmentedControl label="Listening mode" value={playback.readMode?'read':'listen'} onChange={mode=>dispatch({type:'set-read-mode',readMode:mode==='read'})} layout="fill">
        <SegmentedControlItem value="listen" label="Listen"/>
        <SegmentedControlItem value="read" label="Read along"/>
      </SegmentedControl>
      <Card>
        <Stack gap={4}>
          <Text type="label" color="accent">{playback.readMode?'READING NOW':'LISTENING NOW'}</Text>
          <Heading level={2}>{article.activeSentence||'Ready when you are.'}</Heading>
        </Stack>
      </Card>
      <Slider label="Article position" minValue={0} maxValue={Math.max(0,article.sentenceCount-1)} value={article.position} onChange={value=>dispatch({type:'seek',position:value})} getValueLabel={value=>`${Math.round((value/Math.max(1,article.sentenceCount-1))*100)}%`}/>
      <Stack direction="horizontal" gap={3} justify="center" align="center" wrap="wrap">
        <Button label="Back 15 seconds" variant="ghost" onClick={()=>dispatch({type:'skip',direction:-1})}/>
        <Button label={playback.playing?'Pause':'Play'} variant="primary" size="large" onClick={()=>dispatch({type:'toggle-playback'})}/>
        <Button label="Forward 15 seconds" variant="ghost" onClick={()=>dispatch({type:'skip',direction:1})}/>
      </Stack>
      <Stack direction="horizontal" gap={3} justify="between" align="center" wrap="wrap">
        <Button label={`${playback.rate||1}× speed`} onClick={()=>dispatch({type:'cycle-rate'})}/>
        <Button label={article.isBookmarked?'Bookmarked':'Bookmark'} onClick={()=>dispatch({type:'bookmark'})}/>
        <Button label={snapshot.timerUntil?'Timer on':'Sleep timer'} onClick={()=>dispatch({type:'cycle-timer'})}/>
        <Button label="Choose voice" onClick={()=>dispatch({type:'navigate',view:'voices'})}/>
      </Stack>
    </Stack>
  </Section>;
}
