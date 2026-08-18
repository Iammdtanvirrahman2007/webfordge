import { buildPageMap } from '../core/navigationGraph.js';
import { movePageBranch } from '../core/pageBranches.js';

const POS_KEY='webforge-page-map-positions-v28';
const readPositions=()=>{try{return JSON.parse(localStorage.getItem(POS_KEY)||'{}')||{}}catch{return{}}};
const savePositions=v=>localStorage.setItem(POS_KEY,JSON.stringify(v));
const addStyles=()=>{if(document.querySelector('#wfV28MapStyle'))return;const s=document.createElement('style');s.id='wfV28MapStyle';s.textContent=`.wf-v28-map{position:relative;flex:1;overflow:auto;background:#080b11;border-top:1px solid #242938}.wf-v28-node{position:absolute;width:190px;padding:11px 12px;border:1px solid #394055;border-radius:11px;background:#151a25;color:#e8ecf7;text-align:left;box-shadow:0 12px 28px #0007;cursor:grab;z-index:4}.wf-v28-node:hover{border-color:#7c5cff}.wf-v28-node.dragging{opacity:.75;cursor:grabbing}.wf-v28-node strong{display:block;font-size:12px}.wf-v28-node span{display:block;margin-top:4px;font-size:9px;color:#818ba1}.wf-v28-node .child{color:#8f7cff}.wf-v28-edge{position:absolute;height:2px;transform-origin:0 50%;z-index:1;pointer-events:none}.wf-v28-edge.branch{background:#3f9f88}.wf-v28-edge.nav{background:#7467b4}.wf-v28-edge:after{content:"";position:absolute;right:-1px;top:-4px;border-left:8px solid currentColor;border-top:5px solid transparent;border-bottom:5px solid transparent}.wf-v28-help{position:absolute;left:12px;bottom:12px;padding:8px 10px;border:1px solid #303649;border-radius:8px;background:#111520ee;color:#9da6ba;font-size:10px;z-index:8}`;document.head.appendChild(s)};

export function openV28PageMap(){
 addStyles();
 const graph=window.webforge?.getGraph?.();
 const nav=window.webforge?.getNavigationGraph?.()||{edges:{}};
 if(!graph)return;
 const map=buildPageMap(graph,nav), positions=readPositions();
 const root=document.createElement('div');root.className='webforge-overlay';root.innerHTML='<div class="webforge-modal page-map-modal"><div class="webforge-modal-head"><div class="webforge-modal-title">Page Map · v28</div><div class="webforge-modal-subtitle">Drag a page onto another page to change its branch parent</div><div class="webforge-modal-spacer"></div><button class="webforge-modal-close">Close</button></div><div class="wf-v28-map"><div class="wf-v28-help">🌿 Branch relationship • Purple = navigation • Drag node → node = re-parent</div></div></div>';
 root.querySelector('.webforge-modal-close').onclick=()=>root.remove();root.onclick=e=>{if(e.target===root)root.remove()};document.body.appendChild(root);
 const canvas=root.querySelector('.wf-v28-map'),nodes=new Map();
 map.pages.forEach((page,index)=>{
   const node=document.createElement('button');node.className='wf-v28-node';node.dataset.pageId=page.id;node.draggable=true;
   const fallback={x:60+(index%5)*250,y:70+Math.floor(index/5)*170},p=positions[page.id]||fallback;node.style.left=`${p.x}px`;node.style.top=`${p.y}px`;
   const parent=page.data?.branchParentId?graph.entities?.[page.data.branchParentId]:null;
   node.innerHTML=`<strong>◉ ${page.name}</strong><span>${page.data?.route||'/'}</span>${parent?`<span class="child">🌿 child of ${parent.name}</span>`:''}`;
   node.addEventListener('dblclick',()=>{window.webforge?.selectPage?.(page.id);root.remove()});
   node.addEventListener('dragstart',e=>{node.classList.add('dragging');e.dataTransfer.setData('text/webforge-page',page.id)});
   node.addEventListener('dragend',()=>node.classList.remove('dragging'));
   node.addEventListener('dragover',e=>e.preventDefault());
   node.addEventListener('drop',e=>{e.preventDefault();const moved=e.dataTransfer.getData('text/webforge-page');if(!moved||moved===page.id)return;try{const next=movePageBranch(window.webforge.getGraph(),moved,page.id);window.webforge.replaceGraph(next);root.remove();setTimeout(openV28PageMap,80)}catch(err){alert(err.message||'Could not change branch parent')}});
   node.addEventListener('click',e=>{if(e.detail===1)setTimeout(()=>{if(!node.dataset.dragging){}},0)});
   canvas.appendChild(node);nodes.set(page.id,node);
 });
 const edge=(a,b,type,label)=>{const s=nodes.get(a),t=nodes.get(b);if(!s||!t)return;const x1=s.offsetLeft+190,y1=s.offsetTop+s.offsetHeight/2,x2=t.offsetLeft,y2=t.offsetTop+t.offsetHeight/2,dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),el=document.createElement('div');el.className=`wf-v28-edge ${type}`;el.style.width=`${len}px`;el.style.left=`${x1}px`;el.style.top=`${y1}px`;el.style.transform=`rotate(${Math.atan2(dy,dx)}rad)`;if(label)el.title=label;canvas.insertBefore(el,canvas.firstChild)};
 const draw=()=>{canvas.querySelectorAll('.wf-v28-edge').forEach(e=>e.remove());map.pages.forEach(page=>{const parent=page.data?.branchParentId;if(parent)edge(parent,page.id,'branch','Branch')});map.edges.forEach(e=>{if(e.targetPageId)edge(e.sourcePageId,e.targetPageId,'nav',`${e.action}: ${e.sourcePageName} → ${e.targetPageName}`)})};
 draw();
 let moving=null;nodes.forEach(node=>node.addEventListener('pointerdown',e=>{if(e.button!==0)return;moving={node,startX:e.clientX,startY:e.clientY,left:node.offsetLeft,top:node.offsetTop};node.setPointerCapture?.(e.pointerId)}));
 canvas.addEventListener('pointermove',e=>{if(!moving)return;moving.node.style.left=`${Math.max(10,moving.left+e.clientX-moving.startX)}px`;moving.node.style.top=`${Math.max(10,moving.top+e.clientY-moving.startY)}px`;draw()});
 canvas.addEventListener('pointerup',()=>{if(!moving)return;const p=readPositions();p[moving.node.dataset.pageId]={x:moving.node.offsetLeft,y:moving.node.offsetTop};savePositions(p);moving=null});
}
