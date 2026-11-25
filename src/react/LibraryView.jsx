import React,{useMemo} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading} from '@astryxdesign/core/Heading';
import {MoreMenu} from '@astryxdesign/core/MoreMenu';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {SegmentedControl,SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Stack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Icon} from '@astryxdesign/core/Icon';
import {Grid} from '@astryxdesign/core/Grid';
import {AspectRatio} from '@astryxdesign/core/AspectRatio';
import {Section} from '@astryxdesign/core/Section';
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
  return <Card padding={3} variant="muted">
    <Stack gap={3}>
      <Grid columns={{minWidth:180,max:2}} gap={3} width="100%" align="center">
        <Card padding={0}><AspectRatio ratio={1.5} fit="cover"><img src={artSource(article.theme)} alt=""/></AspectRatio></Card>
        <Stack gap={2}>
          <Text type="label" color="accent">{article.finished?'LISTEN AGAIN':'PICK UP WHERE YOU LEFT OFF'}</Text>
          <Heading level={2}>{article.title}</Heading>
          <Text type="supporting">{article.source||'Your library'} · {article.duration||1} min listen</Text>
        </Stack>
      </Grid>
      <ProgressBar label={`Reading progress for ${article.title}`} value={article.progress||0} hasValueLabel/>
      <Stack direction="horizontal" gap={2} justify="between" align="center" wrap="wrap">
        <Text type="supporting">{article.finished?'Finished':'Your place is saved'}</Text>
        <Button label={isPlaying?'Open player':'Continue listening'} variant="primary" onClick={()=>dispatch({type:'open-article',id:article.id,play:!isPlaying})}/>
      </Stack>
    </Stack>
  </Card>;
}

function ArticleCard({article,dispatch}){
  return <Card padding={0} elevation="low">
    <Stack gap={0}>
      <AspectRatio ratio={1.45} fit="cover"><img src={artSource(article.theme)} alt=""/></AspectRatio>
      <Section variant="transparent" padding={3}>
        <Stack gap={2}>
          <Stack gap={1}>
            <Heading level={3}>{article.title}</Heading>
            <Text type="supporting">{article.source||'Your library'} · {article.duration||1} min{article.finished?' · Finished':''}</Text>
          </Stack>
          <Stack direction="horizontal" gap={1} align="center" justify="between">
            <Button label={article.finished?'Listen again':'Open'} variant="ghost" onClick={()=>dispatch({type:'open-article',id:article.id})}/>
            <ArticleActions article={article} dispatch={dispatch}/>
          </Stack>
        </Stack>
      </Section>
    </Stack>
  </Card>;
}

export function LibraryView({snapshot,dispatch,tools}){
  const {articles=[],query='',filter='all',currentId,playback={}}=snapshot;
  const visible=useMemo(()=>selectLibraryArticles(articles,{query,filter}),[articles,query,filter]);
  const current=articles.find(article=>article.id===currentId);
  const showCurrent=!query&&filter!=='finished'&&current;
  const chooseImport=mode=>{dispatch({type:'set-import-mode',mode});dispatch({type:'navigate',view:'add'});};
  return <ViewFrame>
    <Stack gap={8} width="100%">
      <Stack gap={2}>
        <Text type="label" color="accent">SONA</Text>
        <Heading level={1} textWrap="balance">Home</Heading>
        <Text color="secondary">Your reading, with room to breathe.</Text>
      </Stack>
      {showCurrent?<Stack gap={3}><Heading level={2}>Continue listening</Heading><CurrentArticle article={current} isPlaying={!!playback.playing} dispatch={dispatch}/></Stack>:null}
      <Stack gap={3}>
        <Heading level={2}>Bring your own</Heading>
        <Grid columns={{minWidth:160,max:3}} gap={2} width="100%">
          <Button label="Write text" icon={<Icon icon="viewColumns"/>} width="100%" onClick={()=>chooseImport('text')}/>
          <Button label="Paste a link" icon={<Icon icon="externalLink"/>} width="100%" onClick={()=>chooseImport('url')}/>
          <Button label="Upload a file" icon={<Icon icon="upload"/>} width="100%" onClick={()=>chooseImport('file')}/>
        </Grid>
      </Stack>
      <Stack gap={3}>
        <Stack direction="horizontal" gap={3} justify="between" align="center" wrap="wrap">
          <Stack gap={1}>
            <Heading level={2}>{query?'Search results':'Your library'}</Heading>
            <Text color="secondary">Saved for whenever you’re ready.</Text>
          </Stack>
          <Button label="Add article" variant="ghost" onClick={()=>dispatch({type:'navigate',view:'add'})}/>
        </Stack>
        <TextInput type="search" label="Search articles" isLabelHidden value={query} onChange={value=>dispatch({type:'set-query',query:value})} placeholder="Search your library" startIcon="search" hasClear enterKeyHint="search" width="100%"/>
        <SegmentedControl label="Filter library" layout="fill" value={filter} onChange={value=>dispatch({type:'set-filter',filter:value})}>
          <SegmentedControlItem value="all" label="All"/>
          <SegmentedControlItem value="unread" label="To listen"/>
          <SegmentedControlItem value="finished" label="Finished"/>
        </SegmentedControl>
        <Text type="supporting" hasTabularNumbers>{visible.length} {visible.length===1?'article':'articles'}</Text>
        {visible.length?
          <Grid columns={{minWidth:240,max:3}} gap={4} width="100%">
            {visible.map(article=><ArticleCard key={article.id} article={article} dispatch={dispatch}/>) }
          </Grid>:
          <EmptyState headingLevel={3} title={query?'Nothing here just yet.':'Your library starts here.'} description={query?'Try another title or source.':'Paste a link or bring your own words.'} actions={<Button label={query?'Clear search':'Add your first article'} variant="primary" onClick={()=>dispatch(query?{type:'set-query',query:''}:{type:'navigate',view:'add'})}/>}/>
        }
      </Stack>
      {tools}
    </Stack>
  </ViewFrame>;
}
