import React,{useMemo,useState,useSyncExternalStore} from 'react';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Dialog,DialogHeader} from '@astryxdesign/core/Dialog';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {Heading} from '@astryxdesign/core/Heading';
import {Item} from '@astryxdesign/core/Item';
import {List} from '@astryxdesign/core/List';
import {Spinner} from '@astryxdesign/core/Spinner';
import {Stack} from '@astryxdesign/core/Stack';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Tab,TabList} from '@astryxdesign/core/TabList';
import {Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {assertVoiceController,normalizeVoiceSnapshot,VOICE_PROVIDERS} from './voice-controller-contract.js';

const labels={google:'Google',azure:'Azure',eleven:'ElevenLabs',device:'On device'};
const titles={google:'Google Chirp 3 HD',azure:'Azure Neural',eleven:'ElevenLabs',device:'Device voices'};
const allowances={
  google:'Connected through Lire. Generated audio is cached and counts against the shared monthly allowance.',
  azure:'Azure F0 includes a monthly Neural character allowance. Generated audio is cached.',
  eleven:'Free-plan voice access and monthly credits depend on your ElevenLabs account.',
  device:'Uses voices installed in this browser or operating system.',
};

function ConnectDialog({provider,isOpen,onOpenChange,controller,onNotify}){
  const [key,setKey]=useState('');
  const [region,setRegion]=useState('');
  const [error,setError]=useState('');
  const [isSubmitting,setSubmitting]=useState(false);
  const close=next=>{
    if(!next){setKey('');setRegion('');setError('');}
    onOpenChange(next);
  };
  const submit=async event=>{
    event.preventDefault();
    setError('');setSubmitting(true);
    try{
      await controller.connect({provider,key,region:provider==='azure'?region:undefined});
      close(false);
      onNotify?.(`${titles[provider]} connected.`);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Could not connect this provider.');
    }finally{
      setKey('');setRegion('');setSubmitting(false);
    }
  };
  return <Dialog isOpen={isOpen} onOpenChange={close} purpose="form">
    <DialogHeader title={`Connect ${titles[provider]}`} onOpenChange={close}/>
    <Stack as="form" gap={4} padding={4} onSubmit={submit}>
      <FormLayout direction="vertical" defaultOptionality="required">
        <TextInput type="password" label={`${labels[provider]} API key`} value={key} onChange={setKey} isRequired autoComplete="off" hasAutoCorrect={false} hasSpellCheck={false} status={error?{type:'error',message:error}:undefined}/>
        {provider==='azure'?<TextInput label="Azure resource region" value={region} onChange={setRegion} isRequired placeholder="canadacentral" autoCapitalize="none" hasAutoCorrect={false} hasSpellCheck={false}/>:null}
      </FormLayout>
      <Text as="p" type="supporting">The key is sent directly to the server and must never be stored in browser state, analytics, or global events.</Text>
      <Button label={`Connect ${titles[provider]}`} type="submit" variant="primary" isLoading={isSubmitting} isDisabled={!key||provider==='azure'&&!region}/>
    </Stack>
  </Dialog>;
}

export function VoicesView({controller,onNotify}){
  const safeController=useMemo(()=>assertVoiceController(controller),[controller]);
  const readSnapshot=useMemo(()=>{
    let source;
    let normalized;
    return ()=>{
      const next=safeController.getSnapshot();
      if(next!==source){source=next;normalized=normalizeVoiceSnapshot(next);}
      return normalized;
    };
  },[safeController]);
  const snapshot=useSyncExternalStore(safeController.subscribe,readSnapshot,readSnapshot);
  const [query,setQuery]=useState('');
  const [connectProvider,setConnectProvider]=useState('');
  const [disconnectProvider,setDisconnectProvider]=useState('');
  const [isDisconnecting,setDisconnecting]=useState(false);
  const provider=snapshot.provider;
  const providerState=snapshot.providers[provider];
  const needle=query.trim().toLocaleLowerCase();
  const voices=needle?snapshot.voices.filter(voice=>`${voice.name} ${voice.language} ${voice.description}`.toLocaleLowerCase().includes(needle)):snapshot.voices;
  const chooseProvider=next=>safeController.selectProvider(next).catch(cause=>onNotify?.(cause.message,'error'));
  const confirmDisconnect=async()=>{
    setDisconnecting(true);
    try{await safeController.disconnect(disconnectProvider);setDisconnectProvider('');onNotify?.(`${titles[disconnectProvider]} disconnected.`);}
    catch(cause){onNotify?.(cause.message||'Could not disconnect provider.','error');}
    finally{setDisconnecting(false);}
  };
  return <Stack as="main" gap={5} padding={6} data-migration-phase="voices">
    <Stack gap={1}>
      <Heading level={1}>Voices</Heading>
      <Text as="p" color="secondary">Find the voice that makes you want to stay with the story.</Text>
    </Stack>
    <TabList value={provider} onChange={chooseProvider} role="tablist" overflow="auto" hasDivider>
      {VOICE_PROVIDERS.map(id=><Tab key={id} value={id} label={labels[id]} panelId={`voice-panel-${id}`} endContent={<StatusDot variant={snapshot.providers[id].isConnected?'success':'neutral'} label={snapshot.providers[id].isConnected?'Connected':'Not connected'}/>}/>) }
    </TabList>
    <Stack as="section" id={`voice-panel-${provider}`} role="tabpanel" gap={4}>
      <Card>
        <Stack gap={2}>
          <Heading level={2}>{titles[provider]}</Heading>
          <Text as="p" type="supporting">{allowances[provider]}</Text>
          <Text as="p"><StatusDot variant={providerState.isConnected?'success':'neutral'} label={providerState.isConnected?'Connected':'Not connected'}/> {providerState.isConnected?'Connected':'Not connected'}{providerState.isViaLire?' in Lire':''}</Text>
          {!providerState.isConnected&&provider!=='device'?<Button label={provider==='google'?'Check Lire connection':`Connect ${titles[provider]}`} onClick={()=>provider==='google'?safeController.refresh():setConnectProvider(provider)} variant="primary"/>:null}
          {providerState.isConnected&&provider!=='device'?<Button label={`Disconnect ${titles[provider]}`} onClick={()=>setDisconnectProvider(provider)} variant="ghost"/>:null}
        </Stack>
      </Card>
      {snapshot.error?<Banner status="error" title="Voice provider unavailable" description={snapshot.error} endContent={<Button label="Try again" onClick={()=>safeController.refresh()}/>}/>:null}
      {providerState.isConnected?<TextInput type="search" label="Search voices" value={query} onChange={setQuery} isLabelHidden startIcon="search" hasClear enterKeyHint="search"/>:null}
      {snapshot.isLoading?<Spinner label="Loading voices"/>:providerState.isConnected&&voices.length?<List density="balanced" hasDividers header={<Heading level={2}>Available voices</Heading>}>
        {voices.map(voice=><Item key={voice.id} label={voice.name} description={[voice.language,voice.description].filter(Boolean).join(' · ')} isSelected={voice.id===snapshot.selectedVoiceId} onClick={()=>safeController.selectVoice(voice.id)} endContent={voice.id===snapshot.selectedVoiceId?<Text type="label">Selected</Text>:null}/>) }
      </List>:providerState.isConnected?<EmptyState headingLevel={2} title={snapshot.voices.length?'No voices match your search':'No voices available yet'} description={snapshot.voices.length?'Try another name or language.':'Refresh the list or check the provider connection.'} actions={<Button label="Refresh voices" onClick={()=>safeController.refresh()}/>}/>:null}
    </Stack>
    {connectProvider?<ConnectDialog provider={connectProvider} isOpen onOpenChange={open=>!open&&setConnectProvider('')} controller={safeController} onNotify={onNotify}/>:null}
    <AlertDialog isOpen={Boolean(disconnectProvider)} onOpenChange={open=>!open&&setDisconnectProvider('')} title={`Disconnect ${disconnectProvider?titles[disconnectProvider]:'voice provider'}?`} description="Current provider voices will become unavailable. You can reconnect later." actionLabel="Disconnect" onAction={confirmDisconnect} isActionLoading={isDisconnecting}/>
  </Stack>;
}

