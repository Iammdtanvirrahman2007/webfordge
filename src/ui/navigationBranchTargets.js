import { getBranchChildren } from '../core/pageBranches.js';

const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function pages(){return Object.values(window.webforge?.getGraph?.()?.entities||{}).filter(e=>e.type==='page');}
function renderTargetSelect(panel,currentTarget){
  const select=panel.querySelector('#pageTarget'); if(!select) return;
  const all=pages(); const currentPageId=window.webforge?.getSelectedPageId?.();
  const branches=getBranchChildren(window.webforge?.getGraph?.(),currentPageId);
  const branchIds=new Set(branches.map(p=>p.id));
  const branchOptions=branches.map(p=>`<option value="${p.id}" ${p.id===currentTarget?'selected':''}>↳ ${esc(p.name)}</option>`).join('');
  const otherOptions=all.filter(p=>p.id!==currentPageId&&!branchIds.has(p.id)).map(p=>`<option value="${p.id}" ${p.id===currentTarget?'selected':''}>${esc(p.name)}</option>`).join('');
  select.innerHTML=`<option value="">Select page…</option>${branchOptions?`<optgroup label="Branch pages">${branchOptions}</optgroup>`:''}${otherOptions?`<optgroup label="All project pages">${otherOptions}</optgroup>`:''}`;
}
function mount(){
  const inspector=document.querySelector('#inspector'); if(!inspector)return;
  const observer=new MutationObserver(()=>{const panel=inspector.querySelector('.action-editor');const select=panel?.querySelector('#pageTarget');if(select&&!panel.dataset.branchTargets){panel.dataset.branchTargets='1';renderTargetSelect(panel,select.value);select.addEventListener('focus',()=>renderTargetSelect(panel,select.value));}});
  observer.observe(inspector,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
