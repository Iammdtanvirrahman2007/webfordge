const ENTITY_TYPES = new Set([
  'project', 'page', 'component', 'section', 'element',
  'asset', 'style', 'data', 'api', 'config',
]);

function assertEntityType(type) {
  if (!ENTITY_TYPES.has(type)) throw new Error(`Unsupported entity type: ${type}`);
}

function createId(prefix = 'node') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createEntity({ id = createId(), type, name, parentId = null, data = {} }) {
  assertEntityType(type);
  if (!name || typeof name !== 'string') throw new Error('Entity name must be a non-empty string');
  const now = new Date().toISOString();
  return { id, type, name, parentId, data: structuredClone(data), children: [], createdAt: now, updatedAt: now };
}

export function createProject({ id = createId('project'), name = 'Untitled Project' } = {}) {
  const project = createEntity({ id, type: 'project', name });
  return { version: 1, projectId: project.id, entities: { [project.id]: project }, rootIds: [project.id] };
}

export function addEntity(graph, options) {
  const entity = createEntity(options);
  if (graph.entities[entity.id]) throw new Error(`Entity already exists: ${entity.id}`);
  const next = structuredClone(graph);
  next.entities[entity.id] = entity;
  if (entity.parentId) {
    const parent = next.entities[entity.parentId];
    if (!parent) throw new Error(`Parent entity not found: ${entity.parentId}`);
    parent.children.push(entity.id);
    parent.updatedAt = new Date().toISOString();
  } else next.rootIds.push(entity.id);
  return next;
}

export function updateEntity(graph, id, patch = {}) {
  if (!graph.entities[id]) throw new Error(`Entity not found: ${id}`);
  const next = structuredClone(graph);
  Object.assign(next.entities[id], patch, { id, type: next.entities[id].type });
  next.entities[id].updatedAt = new Date().toISOString();
  return next;
}

export function removeEntity(graph, id) {
  if (id === graph.projectId) throw new Error('The project root cannot be removed');
  if (!graph.entities[id]) return graph;
  const next = structuredClone(graph);
  const queue = [id];
  const removed = new Set();
  while (queue.length) {
    const currentId = queue.shift();
    if (removed.has(currentId)) continue;
    removed.add(currentId);
    const entity = next.entities[currentId];
    if (entity) queue.push(...entity.children);
  }
  const entity = next.entities[id];
  if (entity?.parentId && next.entities[entity.parentId]) {
    next.entities[entity.parentId].children = next.entities[entity.parentId].children.filter((child) => child !== id);
  }
  for (const removedId of removed) delete next.entities[removedId];
  next.rootIds = next.rootIds.filter((rootId) => !removed.has(rootId));
  return next;
}

export function getEntity(graph, id) { return graph.entities[id] ?? null; }
export function getChildren(graph, id) {
  const entity = getEntity(graph, id);
  return entity ? entity.children.map((childId) => graph.entities[childId]).filter(Boolean) : [];
}

export function validateGraph(graph) {
  const errors = [];
  if (!graph || graph.version !== 1) errors.push('Unsupported or missing graph version');
  if (!graph?.projectId || !graph?.entities?.[graph.projectId]) errors.push('Missing project root');
  for (const entity of Object.values(graph?.entities ?? {})) {
    try { assertEntityType(entity.type); } catch (error) { errors.push(error.message); }
    if (entity.parentId && !graph.entities[entity.parentId]) errors.push(`Missing parent ${entity.parentId} for ${entity.id}`);
    for (const childId of entity.children ?? []) {
      if (!graph.entities[childId]) errors.push(`Missing child ${childId} referenced by ${entity.id}`);
      else if (graph.entities[childId].parentId !== entity.id) errors.push(`Parent mismatch for child ${childId}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export { ENTITY_TYPES, createId };
