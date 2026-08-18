import {
  addEntity,
  createProject,
  getChildren,
  getEntity,
  removeEntity,
  updateEntity,
} from '../core/projectGraph.js';

let graph = createProject({ name: 'Untitled Project' });
const page = addEntity(graph, { type: 'page', name: 'Home', parentId: graph.projectId, data: { route: '/' } });
graph = page;
const pageId = Object.values(graph.entities).find((entity) => entity.type === 'page')?.id;
const canvas = document.querySelector('#canvas');
const tree = document.querySelector('#layerTree');
const inspector = document.querySelector('#inspector');
const selectionInfo = document.querySelector('#selectionInfo');
let selectedId = null;

const labels = { section: 'Section', heading: 'Heading', text: 'Text', button: 'Button', image: 'Image' };
const defaultStyles = { width: 'auto', minHeight: 'auto', background: '', color: '', padding: '18px', margin: '18px', borderRadius: '0px' };

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function makeContent(type) {
  if (type === 'heading') return '<h1>New Heading</h1>';
  if (type === 'text') return '<p>Start writing here...</p>';
  if (type === 'button') return '<button>Click me</button>';
  if (type === 'image') return '<div class="image-placeholder">Image placeholder</div>';
  return '<div><h2>New Section</h2><p>Section content</p></div>';
}
function targetParent() {
  const selected = selectedId ? getEntity(graph, selectedId) : null;
  return selected && ['element'].includes(selected.type) && selected.data?.type === 'section' ? selected.id : pageId;
}
function add(type) {
  const node = { type: 'element', name: labels[type], parentId: targetParent(), data: { type, content: makeContent(type), styles: { ...defaultStyles } } };
  graph = addEntity(graph, node);
  render();
  select(findLatestId(node.name));
}
function findLatestId(name) {
  return Object.values(graph.entities).filter((entity) => entity.name === name).at(-1)?.id;
}
function renderNode(node, depth = 0) {
  const style = node.data?.styles ?? {};
  const wrapper = document.createElement('div');
  wrapper.className = 'forge-node';
  wrapper.dataset.id = node.id;
  wrapper.style.background = style.background || '';
  wrapper.style.color = style.color || '';
  wrapper.style.padding = style.padding || '';
  wrapper.style.margin = style.margin || '';
  wrapper.style.borderRadius = style.borderRadius || '';
  wrapper.innerHTML = node.data?.content ?? '';
  wrapper.addEventListener('click', (event) => { event.stopPropagation(); select(node.id); });
  for (const child of getChildren(graph, node.id)) wrapper.appendChild(renderNode(child, depth + 1));
  return wrapper;
}
function renderTreeNode(node, depth = 0) {
  const item = document.createElement('div');
  item.className = `tree-item ${node.id === selectedId ? 'selected' : ''}`;
  item.style.paddingLeft = `${8 + depth * 14}px`;
  item.textContent = `${getChildren(graph, node.id).length ? '▾' : '•'} ${node.name}`;
  item.dataset.id = node.id;
  item.onclick = () => select(node.id);
  const wrap = document.createElement('div');
  wrap.appendChild(item);
  getChildren(graph, node.id).forEach((child) => wrap.appendChild(renderTreeNode(child, depth + 1)));
  return wrap;
}
function render() {
  canvas.innerHTML = '';
  const children = getChildren(graph, pageId);
  if (!children.length) canvas.innerHTML = '<div class="drop-hint">Drag an element here to start building</div>';
  else children.forEach((node) => canvas.appendChild(renderNode(node)));
  tree.innerHTML = '';
  if (!children.length) tree.innerHTML = '<div class="empty">No layers yet</div>';
  children.forEach((node) => tree.appendChild(renderTreeNode(node)));
}
function field(label, id, value, type = 'text') {
  return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" value="${escapeHtml(value ?? '')}"></div>`;
}
function select(id) {
  selectedId = id;
  const node = getEntity(graph, id);
  if (!node) return;
  render();
  document.querySelectorAll('.forge-node').forEach((el) => el.classList.toggle('selected', el.dataset.id === id));
  selectionInfo.textContent = node.name;
  const styles = { ...defaultStyles, ...(node.data?.styles ?? {}) };
  inspector.innerHTML = `
    ${field('Name', 'name', node.name)}
    <div class="field"><label>Type</label><input value="${escapeHtml(node.data?.type ?? node.type)}" disabled></div>
    ${field('Padding', 'padding', styles.padding)}
    ${field('Margin', 'margin', styles.margin)}
    ${field('Background', 'background', styles.background)}
    ${field('Text color', 'color', styles.color)}
    ${field('Radius', 'radius', styles.borderRadius)}
    ${field('Content', 'content', node.data?.content ?? '')}
    <button id="delete" class="danger">Delete element</button>`;
  const patch = () => {
    const stylesPatch = { ...styles, padding: inspector.querySelector('#padding').value, margin: inspector.querySelector('#margin').value, background: inspector.querySelector('#background').value, color: inspector.querySelector('#color').value, borderRadius: inspector.querySelector('#radius').value };
    graph = updateEntity(graph, id, { data: { ...node.data, styles: stylesPatch, content: inspector.querySelector('#content').value }, name: inspector.querySelector('#name').value });
    render();
    document.querySelectorAll('.forge-node').forEach((el) => el.classList.toggle('selected', el.dataset.id === id));
  };
  ['name','padding','margin','background','color','radius','content'].forEach((key) => inspector.querySelector(`#${key}`).addEventListener('change', patch));
  inspector.querySelector('#delete').onclick = () => { graph = removeEntity(graph, id); selectedId = null; render(); inspector.innerHTML = '<p>Select an element to edit its properties.</p>'; selectionInfo.textContent = 'Nothing selected'; };
}
document.querySelectorAll('.element').forEach((button) => {
  button.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', button.dataset.type));
  button.addEventListener('click', () => add(button.dataset.type));
});
canvas.addEventListener('dragover', (event) => event.preventDefault());
canvas.addEventListener('drop', (event) => { event.preventDefault(); const type = event.dataTransfer.getData('text/plain'); if (type) add(type); });
canvas.addEventListener('click', () => { selectedId = null; selectionInfo.textContent = 'Nothing selected'; inspector.innerHTML = '<p>Select an element to edit its properties.</p>'; render(); });
document.querySelector('#previewBtn').onclick = () => window.open(location.href, '_blank');
document.querySelector('#exportBtn').onclick = () => {
  const body = canvas.innerHTML.replaceAll('class="forge-node selected"', 'class="forge-node"');
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WebForge Export</title></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'webforge-page.html'; a.click(); URL.revokeObjectURL(a.href);
};
render();