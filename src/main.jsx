import React,{useSyncExternalStore,useState} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav,SideNavHeading,SideNavItem,SideNavSection} from '@astryxdesign/core/SideNav';
import {Theme} from '@astryxdesign/core/theme';
import {LayerProvider} from '@astryxdesign/core/Layer';
import {Button} from '@astryxdesign/core/Button';
import {Stack} from '@astryxdesign/core/Stack';
import {Layout,LayoutContent,LayoutFooter} from '@astryxdesign/core/Layout';
import {Tab,TabList} from '@astryxdesign/core/TabList';
import {Icon} from '@astryxdesign/core/Icon';
import {Text} from '@astryxdesign/core/Text';
import {useMediaQuery} from '@astryxdesign/core/hooks';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import {themes,defaultThemeSlug} from './astryx-themes.js';
import {sonaController} from './sona-controller.js';
import {Phase3Surface} from './react/Phase3Surface.jsx';
import {PlayerView} from './react/PlayerView.jsx';
import {QueueView} from './react/QueueView.jsx';
import {VoicesView} from './voices/VoicesView.jsx';
import {sonaVoiceController} from './voices/sona-voice-controller.js';
import {FeedbackHost} from './react/FeedbackHost.jsx';
import {LibraryTools} from './react/LibraryTools.jsx';
import {startSonaEngine} from './sona-engine.js';

const destinations=[
  {id:'library',label:'Your library'},
  {id:'add',label:'Add an article',icon:'upload'},
  {id:'queue',label:'Listening queue',icon:'menu'},
  {id:'voices',label:'Voices',icon:'microphone'},
];

function NavigationItems({current,onNavigate}){
  return <SideNavSection title="Listening space" isHeaderHidden>
    {destinations.map(item=><SideNavItem key={item.id} label={item.label} icon={item.icon} isSelected={current===item.id||(current==='player'&&item.id==='library')} onClick={()=>onNavigate(item.id)}/>)}
  </SideNavSection>;
}

function SonaShell(){
  const snapshot=useSyncExternalStore(sonaController.subscribe,sonaController.getSnapshot,sonaController.getSnapshot);
  const current=snapshot.view;
  const isDesktop=useMediaQuery('(min-width: 48rem)');
  const [isMobileNavOpen,setMobileNavOpen]=useState(false);
  const navigate=view=>{
    setMobileNavOpen(false);
    sonaController.dispatch({type:'navigate',view});
  };
  const navItems=<NavigationItems current={current} onNavigate={navigate}/>;
  const sideNav=<SideNav resizable={{defaultWidth:288,minWidth:240,maxWidth:360,autoSaveId:'sona-side-nav'}} header={<SideNavHeading heading="Sona" subheading="v0.10.0"/>}>{navItems}</SideNav>;
  const footer=current!=='player'?<LayoutFooter label="Player and primary navigation" padding={2} hasDivider>
    <Stack gap={2}>
      {snapshot.currentArticle?<Stack direction="horizontal" gap={2} align="center" justify="between">
        <Stack gap={.5}>
          <Text type="label">{snapshot.currentArticle.title}</Text>
          <Text type="supporting">{snapshot.currentArticle.source||'Your library'}</Text>
        </Stack>
        <Stack direction="horizontal" gap={1} align="center">
          <Button label="Open player" isIconOnly tooltip="Open player" icon={<Icon icon="menu"/>} variant="ghost" onClick={()=>navigate('player')}/>
          <Button label={snapshot.playback.playing?'Pause':'Play'} variant="primary" onClick={()=>sonaController.dispatch({type:'toggle-playback'})}/>
        </Stack>
      </Stack>:null}
      {!isDesktop?<TabList value={current==='player'?'library':current} onChange={navigate} layout="fill" size="sm" role="navigation">
        <Tab value="library" label="Home" icon={<Icon icon="viewColumns"/>}/>
        <Tab value="add" label="Import" icon={<Icon icon="upload"/>}/>
        <Tab value="queue" label="Queue" icon={<Icon icon="menu"/>}/>
        <Tab value="voices" label="Voices" icon={<Icon icon="microphone"/>}/>
      </TabList>:null}
    </Stack>
  </LayoutFooter>:null;
  return <Theme theme={themes[defaultThemeSlug]} mode="dark">
    <LayerProvider>
    <AppShell sideNav={sideNav} mobileNav={{breakpoint:'md',content:navItems,isOpen:isMobileNavOpen,onOpenChange:setMobileNavOpen}} variant="section" contentPadding={0}>
      <Layout height="fill" contentWidth={960} content={<LayoutContent padding={0}>
      {['library','add'].includes(current)?<Phase3Surface snapshot={snapshot} dispatch={sonaController.dispatch} tools={<LibraryTools snapshot={snapshot} dispatch={sonaController.dispatch}/>}/>:null}
      {current==='player'?<PlayerView snapshot={snapshot} dispatch={sonaController.dispatch}/>:null}
      {current==='queue'?<QueueView snapshot={snapshot} dispatch={sonaController.dispatch}/>:null}
      {current==='voices'?<VoicesView controller={sonaVoiceController} onNotify={message=>sonaController.dispatch({type:'notify',message})}/>:null}
      </LayoutContent>} footer={footer}/>
    </AppShell>
    <FeedbackHost snapshot={snapshot} dispatch={sonaController.dispatch}/>
    </LayerProvider>
  </Theme>;
}

flushSync(()=>createRoot(document.getElementById('root')).render(<SonaShell/>));
startSonaEngine();
