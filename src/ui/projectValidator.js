import { getAssetRegistry } from './assetManager.js';
import { getComponentRegistry } from './componentBridge.js';

export function validateProject(graph){
  const issues=[]; const warnings=[]; const entities=Object.values(graph?.entities||{}); const ids=new Set();
  entities.forEach(e=>{if(ids.has(e.id))issues.push(`Duplicate entity id: ${e.id}`);ids.add(e.id)});
  const pages=entities.filter(e=>e.type==='page');
  if(!pages.length)issues.push('Project has no pages.');
  pages.forEach(page=>{if(!page.children?.length)warnings.push(`Page "${page.name}" is empty.`)});
  entities.filter(e=>e.type==='element').forEach(e=>{
    if(e.parentId && !graph.entities[e.parentId])issues.push(`Orphan element: ${e.name}`);
    if(e.data?.assetId){const asset=getAssetRegistry().assets?.[e.data.assetId];if(!asset)issues.push(`Missing asset reference in "${e.name}".`)}
    if(e.data?.componentId){const component=getComponentRegistry().components?.[e.data.componentId];if(!component)issues.push(`Missing component reference in "${e.name}".`)}
  });
  const names=new Map();entities.filter(e=>e.type==='element').forEach(e=>{const key=`${e.parentId}|${e.name}`;names.set(key,(names.get(key)||0)+1)});names.forEach((count,key)=>{if(count>1)warnings.push(`Duplicate sibling name: ${key.split('|')[1]}`)});
  return {ok:!issues.length,issues,warnings,metrics:{entities:entities.length,pages:pages.length,errors:issues.length,warnings:warnings.length}};
}

function openValidator(){const graph=window.webforge?.getGraph?.();const result=validateProject(graph);const root=document.createElement('div');root.className='webforge-overlay';root.innerHTML=`<div class="webforge-modal"><div class="webforge-modal-head"><div class="webforge-modal-title">Project Validation</div><div class="webforge-modal-subtitle">Structural health check</div><div class="webforge-modal-spacer"></div><button class="webforge-modal-close">Close</button></div><div class="webforge-modal-body"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px"><div class="field"><label>Entities</label><strong>${result.metrics.entities}</strong></div><div class="field"><label>Errors</label><strong>${result.metrics.errors}</strong></div><div class="field"><label>Warnings</label><strong>${result.metrics.warnings}</strong></div></div><h3>${result.ok?'✓ Project structure looks healthy':'⚠ Issues found'}</h3><div>${result.issues.map(x=>`<div style="padding:7px;margin:5px 0;background:#28151a;border:1px solid #6e3640;border-radius:6px;color:#ffb8c2">${x}</div>`).join('')}</div><h3>Warnings</h3><div>${result.warnings.map(x=>`<div style="padding:7px;margin:5px 0;background:#242116;border:1px solid #5e542b;border-radius:6px;color:#e8d98b">${x}</div>`).join('')||'<p class="component-empty">No warnings.</p>'}</div></div>`;root.querySelector('.webforge-modal-close').onclick=()=>root.remove();root.onclick=e=>{if(e.target===root)root.remove()};document.body.appendChild(root)}
function mount(){const actions=document.querySelector('.actions');if(!actions||document.querySelector('#validateBtn'))return;const b=document.createElement('button');b.id='validateBtn';b.textContent='Validate';b.onclick=openValidator;actions.insertBefore(b,actions.querySelector('#saveProjectBtn')||actions.firstChild)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
