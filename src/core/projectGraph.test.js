import assert from 'node:assert/strict';
import test from 'node:test';
import { addEntity, createProject, getChildren, removeEntity, validateGraph } from './projectGraph.js';

test('creates a valid project graph', () => {
  const graph = createProject({ name: 'Demo' });
  assert.equal(graph.entities[graph.projectId].name, 'Demo');
  assert.deepEqual(validateGraph(graph), { valid: true, errors: [] });
});

test('adds parent/child entities', () => {
  let graph = createProject();
  graph = addEntity(graph, { id: 'page_home', type: 'page', name: 'Home', parentId: graph.projectId });
  graph = addEntity(graph, { id: 'hero', type: 'section', name: 'Hero', parentId: 'page_home' });
  assert.deepEqual(getChildren(graph, graph.projectId).map((node) => node.id), ['page_home']);
  assert.deepEqual(getChildren(graph, 'page_home').map((node) => node.id), ['hero']);
  assert.deepEqual(validateGraph(graph), { valid: true, errors: [] });
});

test('removes a subtree', () => {
  let graph = createProject();
  graph = addEntity(graph, { id: 'page_home', type: 'page', name: 'Home', parentId: graph.projectId });
  graph = addEntity(graph, { id: 'hero', type: 'section', name: 'Hero', parentId: 'page_home' });
  graph = removeEntity(graph, 'page_home');
  assert.equal(graph.entities.page_home, undefined);
  assert.equal(graph.entities.hero, undefined);
  assert.deepEqual(validateGraph(graph), { valid: true, errors: [] });
});
