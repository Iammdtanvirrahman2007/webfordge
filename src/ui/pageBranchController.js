import { createPageBranch, getBranchChildren } from '../core/pageBranches.js';

function mount(){
  const button=document.querySelector('#addPage');
  if(!button || button.dataset.branchAware==='1') return;
  button.dataset.branchAware='1';
  document.addEventListener('click',event=>{
    const target=event.target.closest?.('#addPage');
    if(!target) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const graph=window.webforge?.getGraph?.();
    const parentId=window.webforge?.getSelectedPageId?.();
    const parent=graph?.entities?.[parentId];
    if(!graph || !parent || parent.type!=='page') return;
    const children=getBranchChildren(graph,parentId);
    const name=prompt(`New branch page under ${parent.name}`,`Page ${children.length+1}`);
    if(!name) return;
    const next=createPageBranch(graph,parentId,{name});
    window.webforge?.replaceGraph?.(next);
    requestAnimationFrame(()=>{
      const pages=document.querySelectorAll('[data-page]');
      [...pages].find(b=>b.dataset.page===Object.values(next.entities).find(e=>e.type==='page'&&e.name===name&&e.data?.branchParentId===parentId)?.id)?.click();
    });
  },true);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount); else mount();
