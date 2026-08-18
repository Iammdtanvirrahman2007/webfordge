const clone = value => structuredClone(value);

export function createComponentInstance(componentId, parentId, options = {}) {
  const { name = 'Component Instance', props = {}, overrides = {} } = options;
  return {
    type: 'componentInstance',
    name,
    parentId,
    data: { componentId, props: clone(props), overrides: clone(overrides) },
  };
}

export function getComponentInstance(entity) {
  return entity?.type === 'componentInstance' ? entity : null;
}

export function updateComponentInstance(entity, patch = {}) {
  if (!getComponentInstance(entity)) return entity;
  return { ...clone(entity), data: { ...clone(entity.data), ...clone(patch) } };
}

export function setComponentInstanceProp(entity, key, value) {
  if (!getComponentInstance(entity)) return entity;
  return updateComponentInstance(entity, { props: { ...clone(entity.data.props), [key]: value } });
}
