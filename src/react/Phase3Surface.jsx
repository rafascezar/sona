import React from 'react';
import {IntakeView} from './IntakeView.jsx';
import {LibraryView} from './LibraryView.jsx';

export function Phase3Surface({snapshot,dispatch}){
  if(snapshot.view==='library')return <LibraryView snapshot={snapshot} dispatch={dispatch}/>;
  if(snapshot.view==='add')return <IntakeView snapshot={snapshot} dispatch={dispatch}/>;
  return null;
}

export {IntakeView,LibraryView};
