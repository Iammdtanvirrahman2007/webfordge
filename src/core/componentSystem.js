const clone = value => structuredClone(value ?? {});
const slugify = value => String(value || 'component').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'component';

export function createComponentRegistry() {
  return { version: 1, components: {} };
}

export function createComponent(registry, options = {}) {
  const { id = `component_${Date.now().toString(36)}`, name, root, props = [] } = options;
  if (!name) throw new Error('Component name is required');
  const next = clone(registry);
  if (next.components[id]) throw new Error(`Component already exists: ${id}`);
  next.components[id] = { id, name, slug: slugify(name), root: clone(root), props: clone(props), instances: 0 };
  return next;
}

export function getComponent(registry, id) {
  return registry.components[id] ?? null;
}

export function listComponents(registry) {
  return Object.values(registry.components);
}

export function removeComponent(registry, id) {
  if (!registry.components[id]) return registry;
  const next = clone(registry);
  delete next.components[id];
  return next;
}

export function createInstance(componentId, options = {}) {
  const { id = `instance_${Date.now().toString(36)}`, props = {}, overrides = {} } = options;
  return { id, componentId, props: clone(props), overrides: clone(overrides) };
}

export function setInstanceProp(instance, key, value) {
  return { ...clone(instance), props: { ...clone(instance.props), [key]: value } };
}

export function componentSourcePath(component) {
  return `frontend/components/${component.slug}.html`;
}
