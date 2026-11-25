import React,{useEffect,useState} from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav,SideNavHeading,SideNavItem,SideNavSection} from '@astryxdesign/core/SideNav';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/theme-neutral/fonts.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

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
  const [current,setCurrent]=useState('library');
  const [isMobileNavOpen,setMobileNavOpen]=useState(false);
  useEffect(()=>{
    const sync=event=>setCurrent(event.detail?.view||'library');
    window.addEventListener('sona:view',sync);
    return()=>window.removeEventListener('sona:view',sync);
  },[]);
  const navigate=view=>{
    setCurrent(view);
    setMobileNavOpen(false);
    window.dispatchEvent(new CustomEvent('sona:navigate',{detail:{view}}));
  };
  const navItems=<NavigationItems current={current} onNavigate={navigate}/>;
  const sideNav=<SideNav header={<SideNavHeading heading="Sona" subheading="v0.3.0 · a quieter kind of listening"/>}>{navItems}</SideNav>;
  return <Theme theme={neutralTheme} mode="dark">
    <AppShell sideNav={sideNav} mobileNav={{breakpoint:'md',content:navItems,isOpen:isMobileNavOpen,onOpenChange:setMobileNavOpen}} variant="section" contentPadding={0}>
      <section id="app" data-ui-system="astryx" data-migration-phase="navigation" />
    </AppShell>
    <output id="toast" role="status" aria-live="polite" />
    <section id="modal-root" />
  </Theme>;
}

flushSync(()=>createRoot(document.getElementById('root')).render(<SonaShell/>));
await import('./app.js');
