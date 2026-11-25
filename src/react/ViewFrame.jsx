import React,{useEffect,useRef} from 'react';
import {Layout,LayoutContent} from '@astryxdesign/core/Layout';
import {useMediaQuery} from '@astryxdesign/core/hooks';

export function ViewFrame({children,width=960}){
  const wide=useMediaQuery('(min-width: 64rem)');
  const region=useRef(null);
  useEffect(()=>{
    const heading=region.current?.querySelector('h1');
    if(heading)heading.tabIndex=-1;
  },[]);
  return <Layout ref={region} height="auto" contentWidth={width} padding={wide?8:4}>
    <LayoutContent isScrollable={false}>{children}</LayoutContent>
  </Layout>;
}
