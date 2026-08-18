import { createComponentRegistry, createComponent, listComponents, componentSourcePath } from '../core/componentSystem.js';

const key = 'webforge-components-v1';
let registry;
try { registry = JSON.parse(localStorage.getItem(key) || '') } catch { registry = null; }
registry ||= createComponentRegistry();
const list = document.querySelector('#components');
const details = document.querySelector('#details');
let selected = null;

function save(){ localStorage.setItem(key, JSON.stringify(registry)); }
function render(){
  list.innerHTML = '';
  const items = listComponents(registry);
  if (!items.length) list.innerHTML = '<div class="empty">No reusable components yet.</div>';
  items.forEach(c=>{
    const b=document.createElement('button');
    b.className=`component-item ${selected===c.id?'selected':''}`;
    b.textContent=`◇ ${c.name}`;
    b.onclick=()=>{selected=c.id;renderDetails();render();};
    list.appendChild(b);
  });
}
function renderDetails(){
  const c=registry.components[selected];
  if(!c){details.innerHTML='<p>Select a component.</p>';return;}
  details.innerHTML=`<div class="detail-card"><h2>${c.name}</h2><p>Reusable visual component</p><div class="meta"><span>Source</span><code>${componentSourcePath(c)}</code></div><div class="meta"><span>Instances</span><strong>${c.instances ?? 0}</strong></div><div class="meta"><span>Props</span><strong>${c.props?.length ?? 0}</strong></div><h3>Props</h3><div id="props"></div></div>`;
  const props=details.querySelector('#props');
  if(!c.props?.length) props.innerHTML='<div class="empty">No props defined yet.</div>';
  else c.props.forEach(p=>{const row=document.createElement('div');row.className='prop-row';row.innerHTML=`<span>${p.name}</span><code>${p.type||'string'}</code>`;props.appendChild(row);});
}
document.querySelector('#createComponent').onclick=()=>{
  const name=window.prompt('Component name','Header');
  if(!name)return;
  const root={type:'element',name,data:{type:'section',content:'<section><h2>Reusable Component</h2></section>',styles:{}} ,children:[]};
  registry=createComponent(registry,{name,root,props:[{name:'title',type:'string'}]});
  save(); selected=Object.keys(registry.components).at(-1); render(); renderDetails();
};
render(); renderDetails();