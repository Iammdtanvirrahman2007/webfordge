const clone=value=>structuredClone(value??{});
export function createPageBranch(graph,parentPageId,{name='New Page',route}={}){
  const parent=graph?.entities?.[parentPageId]; if(!parent||parent.type!=='page') throw new Error('Branch parent must be a page');
  const id=`page_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const slug=String(route||name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'page';
  const next=clone(graph);
  next.entities[id]={id,type:'page',name,parentId:graph.projectId,data:{route:`/${slug}`,branchParentId:parentPageId}};
  next.entities[id].children=[];
  next.entities[parentPageId].data={...(next.entities[parentPageId].data||{}),branchChildren:[...(next.entities[parentPageId].data?.branchChildren||[]),id]};
  next.entities[parentPageId].children=[...(next.entities[parentPageId].children||[]),id];
  return next;
}
export function getBranchChildren(graph,pageId){
  const page=graph?.entities?.[pageId]; if(!page)return [];
  const ids=page.data?.branchChildren||[];
  return ids.map(id=>graph.entities[id]).filter(Boolean).filter(e=>e.type==='page');
}
export function getBranchParent(graph,pageId){
  const page=graph?.entities?.[pageId]; const id=page?.data?.branchParentId; return id?graph.entities?.[id]||null:null;
}
export function movePageBranch(graph,pageId,newParentPageId){
  const page=graph?.entities?.[pageId], nextParent=graph?.entities?.[newParentPageId];
  if(!page||page.type!=='page') throw new Error('Page not found');
  if(!nextParent||nextParent.type!=='page') throw new Error('Branch parent must be a page');
  if(pageId===newParentPageId) throw new Error('A page cannot branch from itself');
  let cursor=nextParent;
  while(cursor){if(cursor.id===pageId)throw new Error('Cannot create a circular branch');cursor=cursor.data?.branchParentId?graph.entities[cursor.data.branchParentId]:null;}
  const next=clone(graph),oldParentId=page.data?.branchParentId||page.parentId;
  if(oldParentId&&next.entities[oldParentId]){
    next.entities[oldParentId].data={...(next.entities[oldParentId].data||{}),branchChildren:(next.entities[oldParentId].data?.branchChildren||[]).filter(id=>id!==pageId)};
    next.entities[oldParentId].children=(next.entities[oldParentId].children||[]).filter(id=>id!==pageId);
  }
  next.entities[newParentPageId].data={...(next.entities[newParentPageId].data||{}),branchChildren:[...(next.entities[newParentPageId].data?.branchChildren||[]),pageId]};
  next.entities[newParentPageId].children=[...(next.entities[newParentPageId].children||[]),pageId];
  next.entities[pageId].data={...(next.entities[pageId].data||{}),branchParentId:newParentPageId};
  next.entities[pageId].parentId=newParentPageId;
  return next;
}
