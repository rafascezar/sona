import React from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import {Theme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import '@astryxdesign/theme-neutral/fonts.css';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

function CompatibilityShell(){
  return <Theme theme={neutralTheme} mode="dark">
    <section id="app" data-ui-system="astryx" data-migration-phase="foundation" />
    <output id="toast" role="status" aria-live="polite" />
    <section id="modal-root" />
  </Theme>;
}

flushSync(()=>createRoot(document.getElementById('root')).render(<CompatibilityShell/>));
await import('./app.js');
