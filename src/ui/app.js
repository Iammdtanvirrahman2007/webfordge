import {
  addEntity,
  createProject,
  getChildren,
  getEntity,
  removeEntity,
  updateEntity,
} from '../core/projectGraph.js';

let graph = createProject({ name: 'Untitled Project' });
graph = addEntity(graph, { type: 'page', name: 'Home', parentId: graph.projectId, data: { route: '/' } });
const pageId = Object.values(graph.entities).find((entity) => entity.type === 'page')?.id;
const canvas = document.querySelector('#canvas');
const tree = document.querySelector('#layerTree');
const inspector = document.querySelector('#inspector');
const selectionInfo = document.querySelector('#selectionInfo');
let selectedId = null;

const labels = { section: 'Section', heading: 'Heading', text: 'Text', button: 'Button', image: 'Image' };
const defaultStyles = { width: 'auto', minHeight: 'auto', background: '', color: '', padding: '18px', margin: '18px', borderRadius: '0px' };

function escapeHtml(value) { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;'); }
function makeContent(type) {
  if(type==='heading') return '<h1>New Heading</h1>';
  if(type==='text') return '<p>Start writing here...</p>';
  if(type==='button') return '<button>Click me</button>';
  if(type==='image') return '<div class="image-placeholder">Image placeholder</div>';
  return '<div><h2>New Section</h2><p>Section content</p></div>';
}
function targetParent() {
  const selected = selectedId ? getEntity(graph, selectedId) : null;
  return selected?.type === 'element' && selected.data?.type === 'section' ? selected.id : pageId;
}
function add(type) {
  const node = { type:'element', name:labels[type], parentId:targetParent(), data:{type,content:makeContent(type),styles:{...defaultStyles}} };
  graph = addEntity(graph,node);
  render();
  select(node.id);
}
function renderNode(node) {
  const style = {...defaultStyles,...(node.data?.styles??{})};
  const wrapper = document.createElement('div');
  wrapper.className = 'forge-node';
  wrapper.dataset.id = node.id;
  wrapper.style.width = style.width || 'auto';
  wrapper.style.minHeight = style.minHeight || 'auto';
  wrapper.style.background = style.background || '';
  wrapper.style.color = style.color || '';
  wrapper.style.padding = style.padding || '';
  wrapper.style.margin = style.margin || '';
  wrapper.style.borderRadius = style.borderRadius || '';
  wrapper.innerHTML = node.data?.content ?? '';
  wrapper.addEventListener('click',e=>{e.stopPropagation();select(node.id)});
  getChildren(graph,node.id).forEach(child=>wrapper.appendChild(renderNode(child)));
  return wrapper;
}
function renderTreeNode(node,depth=0) {
  const wrap=document.createElement('div');
  const item=document.createElement('div');
  item.className=`tree-item ${node.id===selectedId?'selected':''}`;
  item.style.paddingLeft=`${8+depth*14}px`;
  item.textContent=`${getChildren(graph,node.id).length?'▾':'•'} ${node.name}`;
  item.onclick=()=>select(node.id);
  wrap.appendChild(item);
  getChildren(graph,node.id).forEach(child=>wrap.appendChild(renderTreeNode(child,depth+1)));
  return wrap;
}
function render() {
  canvas.innerHTML='';
  const children=getChildren(graph,pageId);
  if(!children.length) canvas.innerHTML='<div class="drop-hint">Drag an element here to start building</div>';
  else children.forEach(node=>canvas.appendChild(renderNode(node)));
  tree.innerHTML='';
  if(!children.length) tree.innerHTML='<div class="empty">No layers yet</div>';
  else children.forEach(node=>tree.appendChild(renderTreeNode(node)));
}
function field(label,id,value,type='text'){return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" value="${escapeHtml(value??'')}"></div>`;}
function select(id) {
  selectedId=id;
  const node=getEntity(graph,id);
  if(!node)return;
  render();
  document.querySelectorAll('.forge-node').forEach(el=>el.classList.toggle('selected',el.dataset.id===id));
  selectionInfo.textContent=node.name;
  const styles={...defaultStyles,...(node.data?.styles??{})};
  inspector.innerHTML=`${field('Name','name',node.name)}<div class="field"><label>Type</label><input value="${escapeHtml(node.data?.type??node.type)}" disabled></div>${field('Width','width',styles.width)}${field('Min height','minHeight',styles.minHeight)}${field('Padding','padding',styles.padding)}${field('Margin','margin',styles.margin)}${field('Background','background',styles.background)}${field('Text color','color',styles.color)}${field('Radius','radius',styles.borderRadius)}${field('Content','content',node.data?.content??'')}<button id="delete" class="danger">Delete element</button>`;
  const patch=()=>{
    const nextStyles={...styles,width:inspector.querySelector('#width').value,minHeight:inspector.querySelector('#minHeight').value,padding:inspector.querySelector('#padding').value,margin:inspector.querySelector('#margin').value,background:inspector.querySelector('#background').value,color:inspector.querySelector('#color').value,borderRadius:inspector.querySelector('#radius').value};
    graph=updateEntity(graph,id,{name:inspector.querySelector('#name').value,data:{...node.data,styles:nextStyles,content:inspector.querySelector('#content').value}});
    render();
    document.querySelectorAll('.forge-node').forEach(el=>el.classList.toggle('selected',el.dataset.id===id));
  };
  ['name','width','minHeight','padding','margin','background','color','radius','content'].forEach(key=>inspector.querySelector(`#${key}`).addEventListener('change',patch));
  inspector.querySelector('#delete').onclick=()=>{graph=removeEntity(graph,id);selectedId=null;render();selectionInfo.textContent='Nothing selected';inspector.innerHTML='<p>Select an element to edit its properties.</p>';};
}
document.querySelectorAll('.element').forEach(button=>{button.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',button.dataset.type));button.addEventListener('click',()=>add(button.dataset.type));});
canvas.addEventListener('dragover',e=>e.preventDefault());
canvas.addEventListener('drop',e=>{e.preventDefault();const type=e.dataTransfer.getData('text/plain');if(type)add(type);});
canvas.addEventListener('click',()=>{selectedId=null;selectionInfo.textContent='Nothing selected';inspector.innerHTML='<p>Select an element to edit its properties.</p>';render();});
document.querySelector('#previewBtn').onclick=()=>window.open(location.href,'_blank');
document.querySelector('#exportBtn').onclick=()=>{const body=canvas.innerHTML.replaceAll(' class="forge-node selected"',' class="forge-node"');const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WebForge Export</title></head><body>${body}</body></html>`;const blob=new Blob([html],{type:'text/html'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='webforge-page.html';a.click();URL.revokeObjectURL(a.href);};
render();