import React,{useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {FileInput} from '@astryxdesign/core/FileInput';
import {Heading} from '@astryxdesign/core/Heading';
import {Stack} from '@astryxdesign/core/Stack';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Text} from '@astryxdesign/core/Text';
import {Collapsible} from '@astryxdesign/core/Collapsible';

const MAX_BACKUP_SIZE=15*1024*1024;

function cloudVariant(status){
  const value=String(status||'').toLocaleLowerCase();
  if(value.includes('error')||value.includes('failed')||value.includes('offline'))return 'error';
  if(value.includes('saving')||value.includes('connecting')||value.includes('sync'))return 'warning';
  if(value.includes('saved')||value.includes('connected'))return 'success';
  return 'neutral';
}

export function LibraryTools({snapshot,dispatch}){
  const [backup,setBackup]=useState(null);
  const cloudStatus=snapshot.cloudStatus||'Cloud status unavailable';
  const importBackup=file=>{
    setBackup(file);
    if(file)dispatch({type:'import-backup',file});
  };

  return <Collapsible trigger="Library tools & backup" defaultIsOpen={false}>
    <Stack as="section" gap={4} aria-labelledby="library-tools-title">
      <Stack gap={1}>
        <Heading id="library-tools-title" level={2}>Library tools</Heading>
        <Text as="p" type="supporting"><StatusDot variant={cloudVariant(cloudStatus)} label={cloudStatus}/> {cloudStatus}</Text>
      </Stack>
      <Stack direction="horizontal" gap={2} wrap="wrap">
        <Button label="Sync with cloud" onClick={()=>dispatch({type:'sync-cloud'})}/>
        <Button label="Export library backup" onClick={()=>dispatch({type:'export-library'})}/>
      </Stack>
      <FileInput
        label="Import library backup"
        description="Choose a Sona JSON backup up to 15 MB. Existing articles are kept."
        value={backup}
        onChange={importBackup}
        accept="application/json,.json"
        maxSize={MAX_BACKUP_SIZE}
        mode="input"
        placeholder="Choose a backup file"
      />
    </Stack>
  </Collapsible>;
}
