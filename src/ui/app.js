import { ProjectGraph } from '../core/projectGraph.js';

const graph = new ProjectGraph({ name: 'Untitled Project' });
const root = graph.createEntity('page', { name: 'Home', route: '/' });
const canvas = document.querySelector('#canvas');
const tree = document.querySelector('#layerTree');
const inspector = document.querySelector('#inspector');
const selectionInfo = document.querySelector('#selectionInfo');
let selectedId = null;

const labels = { section:'Section', heading:'Heading', text:'Text', button:'Button', image:'Image' };

function makeContent(type){
  if(type==='heading') return '<h1>New Heading</h1>';
  if(type==='text') return '<p>Start writing here...</p>';
  if(type==='button') return '<button>Click me</button>';
  if(type==='image') return '<div style="padding:35px;text-align:center;background:#f0f1f4">Image placeholder</div>';
  return '<div><h2>New Section</h2><p>Section content</p></div>';
}
function add(type){
  const node = graph.createEntity('element',{type,name:labels[type],content:makeContent(type),styles:{}});
  graph.addChild(root.id,node.id);
  render(); select(node.id);
}
function render(){
  const children=graph.getChildren(root.id);
  canvas.innerHTML='';
  if(!children.length){canvas.innerHTML='<div class="drop-hint">Drag an element here to start building</div>'}
  children.forEach(node=>{
    const el=document.createElement('div'); el.className='forge-node'; el.dataset.id=node.id; el.innerHTML=node.content;
    el.addEventListener('click',e=>{e.stopPropagation();select(node.id)}); canvas.appendChild(el);
  });
  tree.innerHTML=children.length?children.map(n=>`<div class="tree-item ${n.id===selectedId?'selected':''}" data-id="${n.id}">▸ ${n.name}</div>`).join(''):'<div class="empty">No layers yet</div>';
  tree.querySelectorAll('.tree-item').forEach(x=>x.onclick=()=>select(x.dataset.id));
}
function select(id){
  selectedId=id; const node=graph.getEntity(id); if(!node)return;
  document.querySelectorAll('.forge-node').forEach(x=>x.classList.toggle('selected',x.dataset.id===id));
  selectionInfo.textContent=node.name;
  inspector.innerHTML=`<div class="field"><label>Name</label><input id="name" value="${node.name}"></div><div class="field"><label>Type</label><input value="${node.type}" disabled></div><div class="field"><label>Content</label><input id="content" value="${String(node.content).replaceAll('"','&quot;')}"></div><button id="delete" class="actions">Delete element</button>`;
  inspector.querySelector('#name').oninput=e=>{node.name=e.target.value;render();select(id)};
  inspector.querySelector('#content').oninput=e=>{node.content=e.target.value;render();select(id)};
  inspector.querySelector('#delete').onclick=()=>{graph.removeEntity(id);selectedId=null;render();inspector.innerHTML='<p>Select an element to edit its properties.</p>'};
  render();
}
document.querySelectorAll('.element').forEach(btn=>{btn.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',btn.dataset.type));btn.addEventListener('click',()=>add(btn.dataset.type))});
canvas.addEventListener('dragover',e=>e.preventDefault()); canvas.addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(type)add(type)});
document.querySelector('#previewBtn').onclick=()=>window.open(location.href,'_blank');
document.querySelector('#exportBtn').onclick=()=>{const blob=new Blob([canvas.innerHTML],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='webforge-page.html';a.click();URL.revokeObjectURL(a.href)};
render();