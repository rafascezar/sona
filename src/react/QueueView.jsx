import React from 'react';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading} from '@astryxdesign/core/Heading';
import {Item} from '@astryxdesign/core/Item';
import {List} from '@astryxdesign/core/List';
import {Stack} from '@astryxdesign/core/Stack';
import {Switch} from '@astryxdesign/core/Switch';
import {Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {IconButton} from '@astryxdesign/core/IconButton';
import {ViewFrame} from './ViewFrame.jsx';

export function QueueView({snapshot,dispatch}){
  const items=snapshot.queueArticles||[];
  return <ViewFrame>
    <Stack gap={6} width="100%">
      <Stack gap={2}>
        <Text type="label" color="accent">ONE GOOD READ AFTER ANOTHER</Text>
        <Heading level={1} textWrap="balance">Listening queue</Heading>
        <Text color="secondary">One good read after another.</Text>
      </Stack>
      <Stack direction="horizontal" justify="between" align="center" wrap="wrap">
        <Heading level={2}>Up next ({items.length})</Heading>
        <Text type="supporting">{items.reduce((total,item)=>total+item.duration,0)} min</Text>
      </Stack>
      {items.length?<List hasDividers density="balanced">
        {items.map((article,index)=><Item key={article.id} label={article.title} labelLines={2} description={`${article.source} · ${article.duration} min`} onClick={()=>dispatch({type:'open-article',id:article.id,play:true})} endContent={<Stack direction="horizontal" gap={1}><IconButton label={`Move ${article.title} up`} icon={<Icon icon="arrowUp"/>} variant="ghost" isDisabled={index===0} onClick={()=>dispatch({type:'queue-move-up',id:article.id})}/><IconButton label={`Remove ${article.title} from queue`} icon={<Icon icon="close"/>} variant="ghost" onClick={()=>dispatch({type:'queue-remove',id:article.id})}/></Stack>}/>) }
      </List>:<EmptyState headingLevel={2} title="Room for one more." description="Add articles from their action menu in your library." actions={<Button label="Browse your library" onClick={()=>dispatch({type:'navigate',view:'library'})}/>}/>} 
      <Switch label="Keep the stories coming" description="Automatically play the next article" value={snapshot.autoplay} onChange={value=>dispatch({type:'set-autoplay',value})}/>
    </Stack>
  </ViewFrame>;
}
