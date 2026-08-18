const DEVICES = ['desktop','tablet','mobile'];
const clone = value => structuredClone(value ?? {});

function selectedId(){
  return document.querySelector('.forge-node.selected')?.dataset.id || document.querySelector('.tree-item.selected')?.dataset.id || null;
}
function activeDevice(){
  return document.querySelector('[data-device].active')?.dataset.device || 'desktop';
}
function getGraph(){ return window.webforge?.getGraph?.() || null; }
function saveGraph(next){ window.webforge?.setGraph?.(next); }
function selectedEntity(){ const graph=getGraph(), id=selectedId(); return graph && id ? graph.entities?.[id] || null : null; }
function responsiveState(node){
  const base={...(node?.data?.styles||{})};
  const responsive=node?.data?.responsive || {mode:'auto',desktop:{},tablet:{},mobile:{}};
  return {mode:responsive.mode||'auto',desktop:{...(responsive.desktop||{})},tablet:{...(responsive.tablet||{})},mobile:{...(responsive.mobile||{})},base};
}
function numericPx(value){ const n=parseFloat(value); return Number.isFinite(n) ? n : null; }
function autoStyles(node, device){
  const s=responsiveState(node), next={...s.base};
  if(device==='desktop') return next;
  const width=numericPx(next.width);
  if(width!==null) next.width='min(100%, '+width+'px)';
  else if(next.width==='auto') next.width='100%';
  next.maxWidth='100%';
  next.left='0px'; next.top='0px';
  if(device==='mobile'){
    if(next.display==='grid') next.gridTemplateColumns='1fr';
    if(next.display==='flex') next.flexDirection='column';
    next.margin='12px';
    next.padding='12px';
  } else {
    if(next.display==='grid' && next.gridTemplateColumns) next.gridTemplateColumns='repeat(2,minmax(0,1fr))';
  }
  return next;
}
function stylesFor(node, device){
  const s=responsiveState(node);
  if(device==='desktop') return s.base;
  if(s.mode==='lock') return s.base;
  if(s.mode==='individual') return {...s.base,...s[device]};
  return autoStyles(node,device);
}
function applyCanvas(){
  const graph=getGraph(); if(!graph)return;
  const device=activeDevice();
  document.querySelectorAll('.forge-node[data-id]').forEach(el=>{
    const node=graph.entities?.[el.dataset.id]; if(!node)return;
    const styles=stylesFor(node,device);
    Object.entries(styles).forEach(([key,value])=>{ if(value!==undefined && value!==null && value!=='') el.style[key]=value; });
    if(device!=='desktop') el.style.maxWidth='100%';
    el.dataset.responsiveMode=responsiveState(node).mode;
  });
  renderModePanel();
}
function setMode(mode){
  const graph=getGraph(), id=selectedId(); if(!graph||!id)return;
  const node=graph.entities[id], current=responsiveState(node);
  if(!DEVICES.includes(activeDevice()))return;
  const next=clone(graph);
  next.entities[id].data={...next.entities[id].data,responsive:{...current,mode}};
  saveGraph(next);
  setTimeout(applyCanvas,0);
}
function editDeviceStyle(key,value){
  const device=activeDevice(); if(device==='desktop')return false;
  const graph=getGraph(), id=selectedId(); if(!graph||!id)return false;
  const node=graph.entities[id], state=responsiveState(node);
  if(state.mode!=='individual') return false;
  const next=clone(graph);
  next.entities[id].data={...next.entities[id].data,responsive:{...state,[device]:{...state[device],[key]:value}}};
  saveGraph(next);
  return true;
}
function renderModePanel(){
  const inspector=document.querySelector('#inspector'); if(!inspector)return;
  const node=selectedEntity(); if(!node)return;
  let panel=inspector.querySelector('.responsive-editor');
  if(!panel){ panel=document.createElement('div'); panel.className='responsive-editor'; inspector.prepend(panel); }
  const state=responsiveState(node), device=activeDevice();
  panel.innerHTML=`<div class="responsive-label">Responsive behavior · ${device}</div><div class="responsive-modes"><button data-rmode="lock" class="${state.mode==='lock'?'active':''}">🔒 Lock Layout</button><button data-rmode="auto" class="${state.mode==='auto'?'active':''}">🪄 Auto Adjust</button><button data-rmode="individual" class="${state.mode==='individual'?'active':''}">🎯 Make Individually</button></div>${device!=='desktop'&&state.mode!=='individual'?'<div class="responsive-hint">Switch to Make Individually to edit this device without changing Desktop.</div>':''}`;
  panel.querySelectorAll('[data-rmode]').forEach(btn=>btn.onclick=()=>setMode(btn.dataset.rmode));
}
function installInspectorGuard(){
  const inspector=document.querySelector('#inspector'); if(!inspector||inspector.dataset.responsiveGuard)return;
  inspector.dataset.responsiveGuard='1';
  inspector.addEventListener('change',event=>{
    const device=activeDevice(); if(device==='desktop')return;
    const target=event.target; if(!['INPUT','SELECT','TEXTAREA'].includes(target.tagName))return;
    const map={radius:'borderRadius',gridColumns:'gridTemplateColumns'};
    const key=map[target.id]||target.id;
    if(['name','content'].includes(key)) return;
    const node=selectedEntity(); if(!node)return;
    const state=responsiveState(node);
    if(state.mode!=='individual'){
      event.preventDefault(); event.stopImmediatePropagation();
      renderModePanel();
      return;
    }
    event.preventDefault(); event.stopImmediatePropagation();
    if(editDeviceStyle(key,target.value)) setTimeout(applyCanvas,0);
  },true);
}
function install(){
  installInspectorGuard();
  const observer=new MutationObserver(()=>{installInspectorGuard();renderModePanel();applyCanvas();});
  observer.observe(document.querySelector('#inspector')||document.body,{childList:true,subtree:true});
  document.querySelectorAll('[data-device]').forEach(btn=>btn.addEventListener('click',()=>setTimeout(applyCanvas,0)));
  window.addEventListener('webforge:graphchange',()=>setTimeout(applyCanvas,0));
  setTimeout(applyCanvas,150);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
export { stylesFor, responsiveState, activeDevice, applyCanvas };
