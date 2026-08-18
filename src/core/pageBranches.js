const clone=value=>structuredClone(value??{});
export function createPageBranch(graph,parentPageId,{name='New Page',route}={}){
  const parent=graph?.entities?.[parentPageId]; if(!parent||parent.type!=='page') throw new Error('Branch parent must be a page');
  const id=`page_${Date.now().toString(36)}`;
  const slug=String(route||name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'page';
  const next=clone(graph);
  next.entities[id]={id,type:'page',name,parentId:graph.projectId,data:{route:`/${slug}`,branchParentId:parentPageId}};
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
