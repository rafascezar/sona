import React,{useMemo} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading} from '@astryxdesign/core/Heading';
import {Item} from '@astryxdesign/core/Item';
import {List} from '@astryxdesign/core/List';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {SegmentedControl,SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Stack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Thumbnail} from '@astryxdesign/core/Thumbnail';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import {ViewFrame} from './ViewFrame.jsx';

const artSource=theme=>`/art/${['technology','care','landscape','growth','connection','discovery'].includes(theme)?theme:'growth'}.svg`;

export function selectLibraryArticles(articles,{query='',filter='all'}={}){
  const needle=query.trim().toLocaleLowerCase();
  return (articles||[]).filter(article=>{
    if(filter==='finished'&&!article.finished)return false;
    if(filter==='unread'&&article.finished)return false;
    return !needle||`${article.title||''} ${article.source||''}`.toLocaleLowerCase().includes(needle);
  });
}

function ArticleActions({article,dispatch}){
  const act=action=>dispatch({type:'article-action',action,id:article.id});
  const items=[
    {label:'Add to listening queue',onClick:()=>act('enqueue')},
    {label:article.finished?'Mark as unread':'Mark as finished',onClick:()=>act('toggle-finished')},
    {label:'Download article text',onClick:()=>act('download')},
  ];
  if(article.url)items.push({label:'Open original',href:article.url,target:'_blank'});
  items.push({type:'divider'},{label:'Remove from library',onClick:()=>act('remove')});
  return <MoreMenu items={items} label={`Actions for ${article.title}`} alignment="end" presentation="adaptive"/>;
}

function CurrentArticle({article,isPlaying,dispatch}){
  const compact=useMediaQuery('(max-width: 40rem)');
  return <Card>
    <Stack gap={3}>
      <Stack direction={compact?'vertical':'horizontal'} gap={3} align={compact?'start':'center'}>
      <Thumbnail src={artSource(article.theme)} alt=""/>
      <Stack gap={2}>
      <Text type="label" color="accent">{article.finished?'LISTEN AGAIN':'PICK UP WHERE YOU LEFT OFF'}</Text>
      <Heading level={2}>{article.title}</Heading>
      <Text type="supporting">{article.source||'Your library'} · {article.duration||1} min listen</Text>
      </Stack></Stack>
      <ProgressBar label={`Reading progress for ${article.title}`} value={article.progress||0} hasValueLabel/>
      <Stack direction="horizontal" gap={2} justify="between" align="center" wrap="wrap">
        <Text type="supporting">{article.finished?'Finished':'Your place is saved'}</Text>
        <Button label={isPlaying?'Open player':'Continue listening'} variant="primary" onClick={()=>dispatch({type:'open-article',id:article.id,play:!isPlaying})}/>
      </Stack>
    </Stack>
  </Card>;
}

export function LibraryView({snapshot,dispatch,tools}){
  const {articles=[],query='',filter='all',currentId,playback={}}=snapshot;
  const visible=useMemo(()=>selectLibraryArticles(articles,{query,filter}),[articles,query,filter]);
  const current=articles.find(article=>article.id===currentId);
  const showCurrent=!query&&filter!=='finished'&&current;
  return <ViewFrame>
    <Stack gap={6} width="100%">
      <Stack gap={2}>
        <Text type="label" color="accent">YOUR OWN LITTLE CORNER</Text>
        <Heading level={1} textWrap="balance">Your library</Heading>
        <Text color="secondary">Something worth your time. Your words, at your pace.</Text>
      </Stack>
      <TextInput type="search" label="Search articles" isLabelHidden value={query} onChange={value=>dispatch({type:'set-query',query:value})} placeholder="Search your articles" startIcon="search" hasClear enterKeyHint="search" width="100%"/>
      <Stack gap={2}>
        <SegmentedControl label="Filter library" layout="fill" value={filter} onChange={value=>dispatch({type:'set-filter',filter:value})}>
          <SegmentedControlItem value="all" label="All"/>
          <SegmentedControlItem value="unread" label="To listen"/>
          <SegmentedControlItem value="finished" label="Finished"/>
        </SegmentedControl>
        <Text type="supporting" hasTabularNumbers>{visible.length} {visible.length===1?'article':'articles'}</Text>
      </Stack>
      {showCurrent?<CurrentArticle article={current} isPlaying={!!playback.playing} dispatch={dispatch}/>:null}
      <Stack gap={3}>
        <Stack direction="horizontal" gap={3} justify="between" align="center" wrap="wrap">
          <Heading level={2}>{query?'Search results':'Saved articles'}</Heading>
          <Button label="Add article" variant="ghost" onClick={()=>dispatch({type:'navigate',view:'add'})}/>
        </Stack>
        {visible.length?<List hasDividers edge="outset" density="balanced">
          {visible.map(article=><Item key={article.id} label={article.title} labelLines={2} description={`${article.source||'Your library'} · ${article.duration||1} min${article.finished?' · Finished':''}`} startContent={<Thumbnail src={artSource(article.theme)} alt=""/>} endContent={<Stack direction="horizontal" gap={1} align="center"><IconButton label={`Open ${article.title}`} tooltip="Open article" variant="ghost" icon={<Icon icon="play"/>} onClick={()=>dispatch({type:'open-article',id:article.id})}/><ArticleActions article={article} dispatch={dispatch}/></Stack>}/>) }
        </List>:<EmptyState headingLevel={3} title={query?'Nothing here just yet.':'Your library starts here.'} description={query?'Try another title or source.':'Paste a link or bring your own words.'} actions={<Button label={query?'Clear search':'Add your first article'} variant="primary" onClick={()=>dispatch(query?{type:'set-query',query:''}:{type:'navigate',view:'add'})}/>}/>} 
      </Stack>
      <Text type="supporting">Five short Sona originals are included to try the player. Add your own reading whenever you’re ready.</Text>
      {tools}
    </Stack>
  </ViewFrame>;
}
