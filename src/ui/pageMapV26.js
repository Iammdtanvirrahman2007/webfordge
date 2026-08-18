import { buildPageMap } from '../core/navigationGraph.js';

export function openInteractivePageMap(){
  const graph=window.webforge?.getGraph?.();
  const nav=window.webforge?.getNavigationGraph?.()||{edges:{}};
  const map=buildPageMap(graph,nav);
  const root=document.createElement('div');
  root.className='webforge-overlay';
  root.innerHTML=`<div class="webforge-modal page-map-v26"><div class="webforge-modal-head"><div class="webforge-modal-title">Page Map</div><div class="webforge-modal-subtitle">Interactive navigation timeline</div><div class="webforge-modal-spacer"></div><button class="page-map-zoom-out">−</button><button class="page-map-zoom-in">＋</button><button class="page-map-reset">Reset</button><button class="webforge-modal-close">Close</button></div><div class="page-map-stage"><div class="page-map-world"></div></div></div>`;
  document.body.appendChild(root);
  const stage=root.querySelector('.page-map-stage'), world=root.querySelector('.page-map-world');
  const style=document.createElement('style');
  style.textContent=`.page-map-v26{width:min(1380px,97vw);height:min(820px,95vh)}.page-map-stage{position:relative;flex:1;overflow:hidden;background:radial-gradient(circle at 20% 20%,#121827 0,#090c12 45%,#070a0f 100%);cursor:grab}.page-map-stage.dragging{cursor:grabbing}.page-map-world{position:absolute;left:0;top:0;width:3000px;height:2000px;transform-origin:0 0}.page-map-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.page-map-node-v26{position:absolute;width:190px;min-height:74px;padding:11px 12px;text-align:left;border:1px solid #394055;border-radius:12px;background:#151a25;color:#e8ecf7;box-shadow:0 12px 30px #0008;cursor:pointer;z-index:3}.page-map-node-v26:hover{border-color:#7c5cff}.page-map-node-v26 strong{display:block;font-size:12px}.page-map-node-v26 small{display:block;margin-top:5px;color:#818ba1;font-size:9px}.page-map-edge-label{font:10px system-ui,sans-serif;fill:#b5acd7}.page-map-edge-path{fill:none;stroke:#6f63a8;stroke-width:2;opacity:.78}.page-map-edge-path:hover{stroke:#b39cff}.page-map-legend{position:absolute;left:14px;bottom:14px;padding:8px 10px;border:1px solid #293044;border-radius:8px;background:#101521dd;color:#818ba1;font:10px system-ui,sans-serif;z-index:5}`;
  document.head.appendChild(style);
  const positions=JSON.parse(localStorage.getItem('webforge-page-map-positions-v1')||'{}');
  const defaultPos=(i)=>({x:80+(i%4)*330,y:80+Math.floor(i/4)*220});
  let scale=1,panX=0,panY=0,drag=null;
  const save=()=>localStorage.setItem('webforge-page-map-positions-v1',JSON.stringify(positions));
  const applyWorld=()=>world.style.transform=`translate(${panX}px,${panY}px) scale(${scale})`;
  const pagePos=(id,i)=>positions[id]||(positions[id]=defaultPos(i));
  map.pages.forEach((p,i)=>{const pos=pagePos(p.id,i);const n=document.createElement('button');n.className='page-map-node-v26';n.dataset.id=p.id;n.style.left=pos.x+'px';n.style.top=pos.y+'px';n.innerHTML=`<strong>◉ ${p.name}</strong><small>${p.data?.route||'/'}</small>`;n.addEventListener('pointerdown',e=>{e.stopPropagation();const sx=e.clientX,sy=e.clientY,ox=pos.x,oy=pos.y;const move=ev=>{pos.x=ox+(ev.clientX-sx)/scale;pos.y=oy+(ev.clientY-sy)/scale;n.style.left=pos.x+'px';n.style.top=pos.y+'px';drawEdges()};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);save()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up)});n.ondblclick=()=>window.webforge?.selectPage?.(p.id);world.appendChild(n)});
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('page-map-svg');world.appendChild(svg);
  const drawEdges=()=>{svg.innerHTML='';for(const edge of map.edges){const s=positions[edge.sourcePageId],t=positions[edge.targetPageId];if(!s||!t)continue;const x1=s.x+190,y1=s.y+37,x2=t.x,y2=t.y+37;const dx=Math.max(70,Math.abs(x2-x1)*.45),d=`M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);path.classList.add('page-map-edge-path');svg.appendChild(path);const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.classList.add('page-map-edge-label');text.setAttribute('x',(x1+x2)/2);text.setAttribute('y',(y1+y2)/2-8);text.textContent=edge.action.replaceAll('-',' ');svg.appendChild(text)}};
  drawEdges();
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('.page-map-node-v26'))return;drag={sx:e.clientX,sy:e.clientY,px:panX,py:panY};stage.classList.add('dragging')});
  window.addEventListener('pointermove',e=>{if(!drag)return;panX=drag.px+e.clientX-drag.sx;panY=drag.py+e.clientY-drag.sy;applyWorld()});
  window.addEventListener('pointerup',()=>{drag=null;stage.classList.remove('dragging')});
  root.querySelector('.page-map-zoom-in').onclick=()=>{scale=Math.min(2.2,scale+.15);applyWorld()};
  root.querySelector('.page-map-zoom-out').onclick=()=>{scale=Math.max(.45,scale-.15);applyWorld()};
  root.querySelector('.page-map-reset').onclick=()=>{scale=1;panX=0;panY=0;applyWorld()};
  root.querySelector('.webforge-modal-close').onclick=()=>{style.remove();root.remove()};
  root.onclick=e=>{if(e.target===root){style.remove();root.remove()}};
  root.querySelector('.page-map-stage').insertAdjacentHTML('beforeend','<div class="page-map-legend">Drag canvas to pan · Wheel-free zoom buttons · Drag pages to rearrange · Double-click a page to open it</div>');
  applyWorld();
  return root;
}
