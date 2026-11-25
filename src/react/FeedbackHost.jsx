import React,{useEffect} from 'react';
import {AlertDialog} from '@astryxdesign/core/AlertDialog';
import {useToast} from '@astryxdesign/core/Toast';

export function FeedbackHost({snapshot,dispatch}){
  const showToast=useToast();
  const notice=snapshot.notice;
  const dialog=snapshot.dialog;

  useEffect(()=>{
    if(!notice?.id||!notice?.message)return undefined;
    showToast({
      body:notice.message,
      uniqueID:String(notice.id),
      collisionBehavior:'overwrite',
      onHide:()=>dispatch({type:'dismiss-notice',id:notice.id}),
    });
    return undefined;
  },[dispatch,notice?.id,notice?.message,showToast]);

  const isRemoveDialog=dialog?.type==='remove-article'&&Boolean(dialog.articleId);
  return <AlertDialog
    isOpen={isRemoveDialog}
    onOpenChange={isOpen=>{if(!isOpen)dispatch({type:'dismiss-dialog'});}}
    title={dialog?.title?`Remove “${dialog.title}”?`:'Remove this article?'}
    description="This removes the article, its saved position, and its bookmarks from your library. This action cannot be undone."
    actionLabel="Remove article"
    cancelLabel="Keep article"
    onAction={()=>dispatch({type:'confirm-remove',articleId:dialog.articleId})}
  />;
}

