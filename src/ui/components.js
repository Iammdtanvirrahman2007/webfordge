import { createComponentRegistry, createComponent, listComponents, componentSourcePath, createInstance, setInstanceProp } from '../core/componentSystem.js';

const key = 'webforge-components-v2';
let registry;
try { registry = JSON.parse(localStorage.getItem(key) || '') } catch { registry = null; }
registry ||= createComponentRegistry();
const list = document.querySelector('#components');
const details = document.querySelector('#details');
let selected = null;
let selectedInstance = null;

function save(){ localStorage.setItem(key, JSON.stringify(registry)); }
function esc(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function render(){
  list.innerHTML = '';
  const items = listComponents(registry);
  if (!items.length) list.innerHTML = '<div class="empty">No reusable components yet.</div>';
  items.forEach(c=>{
    const b=document.createElement('button');
    b.className=`component-item ${selected===c.id?'selected':''}`;
    b.innerHTML=`<b>◇ ${esc(c.name)}</b><small>${c.instances ?? 0} instance(s)</small>`;
    b.onclick=()=>{selected=c.id;selectedInstance=null;renderDetails();render();};
    list.appendChild(b);
  });
}
function renderDetails(){
  const c=registry.components[selected];
  if(!c){details.innerHTML='<p>Select a component.</p>';return;}
  details.innerHTML=`<div class="detail-card"><div class="component-heading"><div><h2>${esc(c.name)}</h2><p>Reusable visual component</p></div><span class="status-pill">READY</span></div><div class="meta"><span>Source</span><code>${esc(componentSourcePath(c))}</code></div><div class="meta"><span>Instances</span><strong>${c.instances ?? 0}</strong></div><div class="meta"><span>Props</span><strong>${c.props?.length ?? 0}</strong></div><div class="component-preview">${c.root?.data?.content || '<div>Empty component</div>'}</div><h3>Props</h3><div id="props"></div><div class="instance-actions"><label>title <input id="propTitle" value="${esc(selectedInstance?.props?.title ?? c.props?.[0]?.default ?? 'Hello')}" /></label><button id="createInstance" class="primary">Create instance</button><button id="updateInstance">Update instance</button></div><p class="hint">One component definition can have many instances. Edit an instance prop here without changing the base component.</p></div>`;
  const props=details.querySelector('#props');
  if(!c.props?.length) props.innerHTML='<div class="empty">No props defined yet.</div>';
  else c.props.forEach(p=>{const row=document.createElement('div');row.className='prop-row';row.innerHTML=`<span>${esc(p.name)}</span><code>${esc(p.type||'string')}</code>`;props.appendChild(row);});
  details.querySelector('#createInstance').onclick=()=>{selectedInstance=createInstance(c.id,{props:{title:details.querySelector('#propTitle').value}});c.instances=(c.instances||0)+1;save();renderDetails();render();};
  details.querySelector('#updateInstance').onclick=()=>{if(!selectedInstance)return;selectedInstance=setInstanceProp(selectedInstance,'title',details.querySelector('#propTitle').value);renderDetails();};
}
document.querySelector('#createComponent').onclick=()=>{
  const name=window.prompt('Component name','Header');
  if(!name)return;
  const root={type:'element',name,data:{type:'section',content:'<section><h2>Reusable Component</h2></section>',styles:{}},children:[]};
  registry=createComponent(registry,{name,root,props:[{name:'title',type:'string',default:'Hello'}]});
  save(); selected=Object.keys(registry.components).at(-1); render(); renderDetails();
};
render(); renderDetails();