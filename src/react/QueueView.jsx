import React from 'react';
import {Button} from '@astryxdesign/core/Button';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {Heading} from '@astryxdesign/core/Heading';
import {Item} from '@astryxdesign/core/Item';
import {List} from '@astryxdesign/core/List';
import {Section} from '@astryxdesign/core/Section';
import {Stack} from '@astryxdesign/core/Stack';
import {Switch} from '@astryxdesign/core/Switch';
import {Text} from '@astryxdesign/core/Text';

export function QueueView({snapshot,dispatch}){
  const items=snapshot.queueArticles||[];
  return <Section variant="transparent" padding={6}>
    <Stack gap={6} maxWidth="72rem">
      <Stack gap={2}>
        <Text type="label" color="accent">ONE GOOD READ AFTER ANOTHER</Text>
        <Heading level={1} type="display-2" textWrap="balance">A little more to listen to.</Heading>
        <Text type="large" color="secondary">Make a little space. We’ll keep your place.</Text>
      </Stack>
      <Stack direction="horizontal" justify="between" align="center" wrap="wrap">
        <Heading level={2}>Up next ({items.length})</Heading>
        <Text type="supporting">{items.reduce((total,item)=>total+item.duration,0)} min</Text>
      </Stack>
      {items.length?<List hasDividers density="balanced">
        {items.map((article,index)=><Item key={article.id} label={`${index+1}. ${article.title}`} description={`${article.source} · ${article.duration} min`} onClick={()=>dispatch({type:'open-article',id:article.id,play:true})} endContent={<Stack direction="horizontal" gap={1}><Button label="Move up" variant="ghost" isDisabled={index===0} onClick={()=>dispatch({type:'queue-move-up',id:article.id})}/><Button label="Remove" variant="ghost" onClick={()=>dispatch({type:'queue-remove',id:article.id})}/></Stack>}/>) }
      </List>:<EmptyState headingLevel={2} title="Room for one more." description="Add articles from their action menu in your library." actions={<Button label="Browse your library" onClick={()=>dispatch({type:'navigate',view:'library'})}/>}/>} 
      <Switch label="Keep the stories coming" description="Automatically play the next article" value={snapshot.autoplay} onChange={value=>dispatch({type:'set-autoplay',value})}/>
    </Stack>
  </Section>;
}
