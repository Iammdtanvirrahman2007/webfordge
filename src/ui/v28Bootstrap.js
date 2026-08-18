import { createPageBranch, getBranchChildren } from '../core/pageBranches.js';
import { openV28PageMap } from './v28PageMap.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const safeSlug = value => String(value || 'page').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';

function installBranchPageCreation() {
  const original = document.querySelector('#addPage');
  if (!original || original.dataset.v28Installed) return;
  const replacement = original.cloneNode(true);
  replacement.dataset.v28Installed = '1';
  original.replaceWith(replacement);
  replacement.addEventListener('click', () => {
    const graph = window.webforge?.getGraph?.();
    const parentId = window.webforge?.getSelectedPageId?.();
    if (!graph || !parentId) return;
    const parent = graph.entities?.[parentId];
    const name = prompt(`Create a branch page under ${parent?.name || 'current page'}`, 'New Page');
    if (!name) return;
    try {
      const next = createPageBranch(graph, parentId, { name, route: safeSlug(name) });
      const childId = next.entities[parentId].children.at(-1);
      window.webforge.replaceGraph(next);
      if (childId) window.webforge.selectPage?.(childId);
    } catch (error) {
      alert(error.message || 'Could not create branch page.');
    }
  });
}

function refreshPageTargetGroups() {
  const action = document.querySelector('#buttonAction');
  const target = document.querySelector('#pageTarget');
  if (!action || !target || action.value !== 'open-page') return;
  const graph = window.webforge?.getGraph?.();
  const currentId = window.webforge?.getSelectedPageId?.();
  if (!graph || !currentId) return;
  const pages = Object.values(graph.entities || {}).filter(entity => entity.type === 'page');
  const branches = getBranchChildren(graph, currentId);
  const branchIds = new Set(branches.map(page => page.id));
  const currentValue = target.value;
  const rest = pages.filter(page => page.id !== currentId && !branchIds.has(page.id));
  target.innerHTML = '';
  if (branches.length) {
    const group = document.createElement('optgroup');
    group.label = `🌿 ${graph.entities[currentId]?.name || 'Current Page'} branches`;
    branches.forEach(page => {
      const option = document.createElement('option'); option.value = page.id; option.textContent = page.name; group.appendChild(option);
    });
    target.appendChild(group);
  }
  if (rest.length) {
    const group = document.createElement('optgroup'); group.label = 'All project pages';
    rest.forEach(page => { const option = document.createElement('option'); option.value = page.id; option.textContent = page.name; group.appendChild(option); });
    target.appendChild(group);
  }
  if ([...target.options].some(option => option.value === currentValue)) target.value = currentValue;
}

function installPageMapOverride() {
  const button = document.querySelector('#pageMapBtn');
  if (!button || button.dataset.v28MapInstalled) return;
  const replacement = button.cloneNode(true);
  replacement.dataset.v28MapInstalled = '1';
  button.replaceWith(replacement);
  replacement.onclick = openV28PageMap;
}

function install() {
  installBranchPageCreation();
  installPageMapOverride();
  refreshPageTargetGroups();
  const inspectorObserver = new MutationObserver(refreshPageTargetGroups);
  inspectorObserver.observe(document.querySelector('#inspector') || document.body, { childList: true, subtree: true });
  window.addEventListener('webforge:graphchange', () => { refreshPageTargetGroups(); installPageMapOverride(); });
  window.addEventListener('webforge:navigationchange', refreshPageTargetGroups);
  setTimeout(installPageMapOverride, 200);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', async () => { await sleep(100); install(); });
else setTimeout(install, 100);
