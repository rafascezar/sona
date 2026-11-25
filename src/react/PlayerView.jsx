import React,{useEffect,useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Item} from '@astryxdesign/core/Item';
import {List} from '@astryxdesign/core/List';
import {Section} from '@astryxdesign/core/Section';
import {SegmentedControl,SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Selector} from '@astryxdesign/core/Selector';
import {Slider} from '@astryxdesign/core/Slider';
import {Stack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';
import {Thumbnail} from '@astryxdesign/core/Thumbnail';

const rateOptions=[.75,1,1.25,1.5,1.75,2].map(rate=>({value:String(rate),label:`${rate}×`}));
const timerOptions=[0,15,30,45,60].map(minutes=>({value:String(minutes),label:minutes?`${minutes} minutes`:'Off'}));
const artSource=theme=>`/art/${['technology','care','landscape','growth','connection','discovery'].includes(theme)?theme:'growth'}.svg`;

function ReadingPassage({article,dispatch}){
  const sentences=article.sentences||[];
  if(!sentences.length)return <Card><Text>Ready when you are.</Text></Card>;
  return <Card padding={0}>
    <List density="spacious" hasDividers edge="bleed" header={<Heading level={2}>Read along</Heading>}>
      {sentences.map(sentence=><Item key={sentence.index} label={sentence.text} labelLines={0} isSelected={sentence.index===article.position} onClick={()=>dispatch({type:'seek',position:sentence.index})}/>)}
    </List>
  </Card>;
}

function Bookmarks({article,dispatch}){
  const bookmarks=article.bookmarks||[];
  if(!bookmarks.length)return null;
  const byIndex=new Map((article.sentences||[]).map(sentence=>[sentence.index,sentence.text]));
  return <Stack gap={2}>
    <Heading level={2}>Saved passages</Heading>
    <List hasDividers edge="outset">
      {bookmarks.map(position=><Item key={position} label={byIndex.get(position)||`Passage ${position+1}`} description={`Passage ${position+1}`} onClick={()=>dispatch({type:'seek',position})}/>) }
    </List>
  </Stack>;
}

export function PlayerView({snapshot,dispatch}){
  const article=snapshot.currentArticle;
  const {playback={}}=snapshot;
  const sentenceCount=article?.sentences?.length||article?.sentenceCount||1;
  const maxPosition=Math.max(0,sentenceCount-1);
  const [draftPosition,setDraftPosition]=useState(()=>Math.min(article?.position||0,maxPosition));
  useEffect(()=>{
    setDraftPosition(Math.min(article?.position||0,maxPosition));
  },[article?.id,article?.position,maxPosition]);
  if(!article)return null;
  const commitPosition=position=>{
    const next=Math.min(Math.max(0,Math.round(position)),maxPosition);
    setDraftPosition(next);
    if(next!==article.position)dispatch({type:'seek',position:next});
  };
  return <Section variant="transparent" padding={6}>
    <Stack gap={6} maxWidth="72rem">
      <Stack direction="horizontal" gap={4} align="center" wrap="wrap">
        <Thumbnail src={artSource(article.theme)} alt={`Abstract ${article.theme||'growth'} artwork for ${article.title}`}/>
        <Stack gap={2}>
          <Text type="label" color="accent">YOUR LISTENING SPACE</Text>
          <Heading level={1} type="display-2" textWrap="balance">{article.title}</Heading>
          <Text color="secondary">{article.author||article.source} · {article.duration} min listen</Text>
        </Stack>
      </Stack>
      <SegmentedControl label="Listening mode" value={playback.readMode?'read':'listen'} onChange={mode=>dispatch({type:'set-read-mode',readMode:mode==='read'})} layout="fill">
        <SegmentedControlItem value="listen" label="Listen"/>
        <SegmentedControlItem value="read" label="Read along"/>
      </SegmentedControl>
      {playback.readMode?<ReadingPassage article={article} dispatch={dispatch}/>:<Card>
        <Stack gap={4}>
          <Text type="label" color="accent">LISTENING NOW</Text>
          <Heading level={2}>{article.activeSentence||'Ready when you are.'}</Heading>
        </Stack>
      </Card>}
      <Slider label="Article position" min={0} max={maxPosition} step={1} value={draftPosition} onChange={setDraftPosition} onChangeEnd={commitPosition} formatValue={value=>`${Math.round((value/Math.max(1,maxPosition))*100)}%`} width="100%"/>
      <Stack direction="horizontal" gap={3} justify="center" align="center" wrap="wrap">
        <Button label="Back 15 seconds" variant="ghost" onClick={()=>dispatch({type:'skip',direction:-1})}/>
        <Button label={playback.playing?'Pause':'Play'} variant="primary" size="lg" onClick={()=>dispatch({type:'toggle-playback'})}/>
        <Button label="Forward 15 seconds" variant="ghost" onClick={()=>dispatch({type:'skip',direction:1})}/>
      </Stack>
      <Stack direction="horizontal" gap={3} justify="between" align="center" wrap="wrap">
        <Selector label="Playback speed" isLabelHidden value={String(playback.rate||1)} options={rateOptions} onChange={rate=>dispatch({type:'set-rate',rate:Number(rate)})} variant="secondary" presentation="adaptive"/>
        <Button label={article.isBookmarked?'Bookmarked':'Bookmark'} onClick={()=>dispatch({type:'bookmark'})}/>
        <Selector label="Sleep timer" isLabelHidden value={String(snapshot.timerMinutes||0)} options={timerOptions} onChange={minutes=>dispatch({type:'set-timer',minutes:Number(minutes)})} variant="secondary" presentation="adaptive"/>
        <Button label="Choose voice" onClick={()=>dispatch({type:'navigate',view:'voices'})}/>
      </Stack>
      <Bookmarks article={article} dispatch={dispatch}/>
    </Stack>
  </Section>;
}
