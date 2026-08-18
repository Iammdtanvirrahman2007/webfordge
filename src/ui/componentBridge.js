import { createComponentRegistry, createInstance, listComponents, getComponent, setInstanceProp } from '../core/componentSystem.js';

const STORAGE_KEY = 'webforge-components-v1';
const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '') || createComponentRegistry(); } catch { return createComponentRegistry(); } };
const save = registry => localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));

export function getComponentRegistry() { return load(); }
export function createComponentInstance(componentId, props = {}) { const registry = load(); const component = getComponent(registry, componentId); if (!component) throw new Error(`Component not found: ${componentId}`); return createInstance(componentId, { props }); }
export function updateInstanceProp(instance, key, value) { return setInstanceProp(instance, key, value); }
export function markInstanceUsed(componentId) { const registry = load(); const component = registry.components[componentId]; if (component) { component.instances = (component.instances || 0) + 1; save(registry); } return registry; }

export function mountComponentLibrary(target, onInsert) {
  if (!target) return () => {};
  target.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'component-library-title';
  title.textContent = 'Components';
  target.appendChild(title);
  const list = document.createElement('div');
  list.className = 'component-library-list';
  const components = listComponents(load());
  if (!components.length) {
    const empty = document.createElement('div');
    empty.className = 'component-library-empty';
    empty.textContent = 'Create reusable components from the Components panel.';
    list.appendChild(empty);
  }
  components.forEach(component => {
    const button = document.createElement('button');
    button.className = 'component-library-item';
    button.innerHTML = `<strong>◇ ${component.name}</strong><span>${component.props?.length || 0} props</span>`;
    button.addEventListener('click', () => {
      const instance = createComponentInstance(component.id);
      markInstanceUsed(component.id);
      onInsert?.(instance, component);
    });
    list.appendChild(button);
  });
  target.appendChild(list);
  return () => { target.innerHTML = ''; };
}

export { STORAGE_KEY };
