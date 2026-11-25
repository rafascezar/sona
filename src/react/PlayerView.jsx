import React,{useEffect,useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Item} from '@astryxdesign/core/Item';
import {List} from '@astryxdesign/core/List';
import {SegmentedControl,SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Selector} from '@astryxdesign/core/Selector';
import {Slider} from '@astryxdesign/core/Slider';
import {Stack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';
import {IconButton} from '@astryxdesign/core/IconButton';
import {Icon} from '@astryxdesign/core/Icon';
import {Grid} from '@astryxdesign/core/Grid';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {Collapsible} from '@astryxdesign/core/Collapsible';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {ViewFrame} from './ViewFrame.jsx';

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
  return <Collapsible trigger={`Saved passages (${bookmarks.length})`} defaultIsOpen={false}>
    <List hasDividers edge="outset">
      {bookmarks.map(position=><Item key={position} label={byIndex.get(position)||`Passage ${position+1}`} description={`Passage ${position+1}`} onClick={()=>dispatch({type:'seek',position})}/>) }
    </List>
  </Collapsible>;
}

export function PlayerView({snapshot,dispatch}){
  const wide=useMediaQuery('(min-width: 64rem)');
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
  return <ViewFrame>
    <Grid columns={wide?2:1} gap={6} width="100%" align="start">
      <Stack gap={4}>
        <Card padding={0}><AspectRatio ratio={wide?1.25:2.8} fit="cover"><img src={artSource(article.theme)} alt=""/></AspectRatio></Card>
        <Stack gap={2}>
          <Heading level={1} textWrap="balance">{article.title}</Heading>
          <Text color="secondary">{article.author||article.source} · {article.duration} min listen</Text>
        </Stack>
      </Stack>
      <Stack gap={4} width="100%">
      <SegmentedControl label="Listening mode" value={playback.readMode?'read':'listen'} onChange={mode=>dispatch({type:'set-read-mode',readMode:mode==='read'})} layout="fill">
        <SegmentedControlItem value="listen" label="Listen"/>
        <SegmentedControlItem value="read" label="Read along"/>
      </SegmentedControl>
      {playback.readMode?<ReadingPassage article={article} dispatch={dispatch}/>:<Card>
        <Stack gap={4}>
          <Text type="label" color="accent">Reading now</Text>
          <Text>{article.activeSentence||'Ready when you are.'}</Text>
        </Stack>
      </Card>}
      <Slider label="Article position" min={0} max={maxPosition} step={1} value={draftPosition} onChange={setDraftPosition} onChangeEnd={commitPosition} formatValue={value=>`${Math.round((value/Math.max(1,maxPosition))*100)}%`} width="100%"/>
      <Stack as="section" aria-label="Playback controls" direction="horizontal" gap={4} justify="center" align="center">
        <Stack gap={.5} align="center"><IconButton label="Back 15 seconds" tooltip="Back 15 seconds" size="lg" variant="ghost" icon={<Icon icon="chevronsLeft"/>} onClick={()=>dispatch({type:'skip',direction:-1})}/><Text type="supporting">15s</Text></Stack>
        <Button label={playback.playing?'Pause':'Play'} variant="primary" size="lg" width="6rem" onClick={()=>dispatch({type:'toggle-playback'})}/>
        <Stack gap={.5} align="center"><IconButton label="Forward 15 seconds" tooltip="Forward 15 seconds" size="lg" variant="ghost" icon={<Icon icon="chevronsRight"/>} onClick={()=>dispatch({type:'skip',direction:1})}/><Text type="supporting">15s</Text></Stack>
      </Stack>
      <Grid columns={{minWidth:240,max:2}} gap={3} width="100%">
        <Selector label="Playback speed" width="100%" value={String(playback.rate||1)} options={rateOptions} onChange={rate=>dispatch({type:'set-rate',rate:Number(rate)})} variant="secondary" presentation="adaptive"/>
        <Selector label="Sleep timer" width="100%" value={String(snapshot.timerMinutes||0)} options={timerOptions} onChange={minutes=>dispatch({type:'set-timer',minutes:Number(minutes)})} variant="secondary" presentation="adaptive"/>
        <Button label={article.isBookmarked?'Bookmarked':'Bookmark'} width="100%" aria-pressed={article.isBookmarked} onClick={()=>dispatch({type:'bookmark'})}/>
        <Button label="Choose voice" width="100%" onClick={()=>dispatch({type:'navigate',view:'voices'})}/>
      </Grid>
      <Bookmarks article={article} dispatch={dispatch}/>
      </Stack>
    </Grid>
  </ViewFrame>;
}
