import React,{useSyncExternalStore,useState} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav,SideNavHeading,SideNavItem,SideNavSection} from '@astryxdesign/core/SideNav';
import {Theme} from '@astryxdesign/core/theme';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import {sonaTheme} from './themes/sona/sona.js';
import './themes/sona/sona.fonts.css';
import './themes/sona/sona.css';
import {sonaController} from './sona-controller.js';
import {Phase3Surface} from './react/Phase3Surface.jsx';

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
  const [isMobileNavOpen,setMobileNavOpen]=useState(false);
  const navigate=view=>{
    setMobileNavOpen(false);
    sonaController.dispatch({type:'navigate',view});
  };
  const navItems=<NavigationItems current={current} onNavigate={navigate}/>;
  const sideNav=<SideNav resizable={{defaultWidth:288,minWidth:240,maxWidth:360,autoSaveId:'sona-side-nav'}} header={<SideNavHeading heading="Sona" subheading="v0.4.0 · a quieter kind of listening"/>}>{navItems}</SideNav>;
  return <Theme theme={sonaTheme} mode="dark">
    <AppShell sideNav={sideNav} mobileNav={{breakpoint:'md',content:navItems,isOpen:isMobileNavOpen,onOpenChange:setMobileNavOpen}} variant="section" contentPadding={0}>
      {['library','add'].includes(current)?<Phase3Surface snapshot={snapshot} dispatch={sonaController.dispatch}/>:null}
      <section id="app" hidden={['library','add'].includes(current)} data-ui-system="astryx" data-migration-phase="intake" />
    </AppShell>
    <output id="toast" role="status" aria-live="polite" />
    <section id="modal-root" />
  </Theme>;
}

flushSync(()=>createRoot(document.getElementById('root')).render(<SonaShell/>));
await import('./app.js');
