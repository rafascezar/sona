import React,{useState} from 'react';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {FileInput} from '@astryxdesign/core/FileInput';
import {FormLayout} from '@astryxdesign/core/FormLayout';
import {Heading} from '@astryxdesign/core/Heading';
import {SegmentedControl,SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Stack} from '@astryxdesign/core/Stack';
import {Text} from '@astryxdesign/core/Text';
import {TextArea} from '@astryxdesign/core/TextArea';
import {TextInput} from '@astryxdesign/core/TextInput';
import {ViewFrame} from './ViewFrame.jsx';

const MAX_FILE_SIZE=15*1024*1024;

function Preview({preview,dispatch}){
  if(!preview)return null;
  return <Card>
    <Stack gap={3}>
      <Text type="label" color="accent">READY WHEN YOU ARE</Text>
      <Heading level={2}>{preview.title}</Heading>
      <Text type="supporting">{preview.source||'Your library'}{preview.duration?` · ${preview.duration} min listen`:''}</Text>
      {preview.excerpt?<Text>{preview.excerpt}</Text>:null}
      <Stack direction="horizontal" gap={2} wrap="wrap">
        <Button label="Save & listen" variant="primary" onClick={()=>dispatch({type:'save-preview',play:true})}/>
        <Button label="Save to library" onClick={()=>dispatch({type:'save-preview',play:false})}/>
      </Stack>
    </Stack>
  </Card>;
}

export function IntakeView({snapshot,dispatch}){
  const {importMode='url',busy=false,preview=null,importError=''}=snapshot;
  const [url,setUrl]=useState('');
  const [title,setTitle]=useState('');
  const [text,setText]=useState('');
  const [file,setFile]=useState(null);
  const submit=event=>{
    event.preventDefault();
    dispatch({type:'submit-import',mode:importMode,url,title,text,file});
  };
  return <ViewFrame width={640}>
    <Stack gap={6} width="100%">
      <Stack gap={2}>
        <Text type="label" color="accent">BRING YOUR OWN READING</Text>
        <Heading level={1} textWrap="balance">Add an article</Heading>
        <Text color="secondary">Bring a link, a document, or a few words of your own.</Text>
      </Stack>
      <SegmentedControl label="Article import method" value={importMode} onChange={mode=>dispatch({type:'set-import-mode',mode})} layout="fill" isDisabled={busy} disabledMessage="Wait for the current article to finish preparing.">
        <SegmentedControlItem value="url" label="Link"/>
        <SegmentedControlItem value="text" label="Text"/>
        <SegmentedControlItem value="file" label="File"/>
      </SegmentedControl>
      <form onSubmit={submit} aria-busy={busy}>
        <Stack gap={4}>
          <FormLayout direction="vertical" defaultOptionality="required">
            {importMode==='url'?<TextInput type="url" label="Article link" value={url} onChange={setUrl} placeholder="https://a-story-worth-reading.com/article" description="Public articles work best. If a page blocks readers, paste its text instead." isRequired isDisabled={busy} width="100%"/>:null}
            {importMode==='text'?<>
              <TextInput label="Title" value={title} onChange={setTitle} placeholder="Something worth remembering" isRequired isDisabled={busy} width="100%"/>
              <TextArea label="Your words" value={text} onChange={setText} rows={9} placeholder="Start writing or paste an article here…" isRequired isDisabled={busy} width="100%"/>
            </>:null}
            {importMode==='file'?<FileInput label="Article file" value={file} onChange={setFile} mode="dropzone" accept=".txt,.md,.markdown,.html,.htm,.pdf" maxSize={MAX_FILE_SIZE} description="PDF, TXT, Markdown, or HTML · up to 15 MB" isRequired isDisabled={busy} isLoading={busy} width="100%"/>:null}
          </FormLayout>
          {importError?<Banner status="error" title="We couldn’t prepare that reading" description={importError}/>:null}
          <Button type="submit" label={importMode==='url'?'Find article':'Prepare article'} variant="primary" isLoading={busy} isDisabled={busy}/>
        </Stack>
      </form>
      <Preview preview={preview} dispatch={dispatch}/>
      <Banner status="info" title="Your library stays with you" description="Your library syncs privately across your devices. A local backup keeps your reading safe while offline."/>
    </Stack>
  </ViewFrame>;
}
