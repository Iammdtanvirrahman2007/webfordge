const BASE_FILES = [
  { path: 'frontend/pages/Home.html', kind: 'page', language: 'html' },
  { path: 'frontend/styles/global.css', kind: 'style', language: 'css' },
  { path: 'frontend/app.js', kind: 'logic', language: 'javascript' },
  { path: 'README.md', kind: 'documentation', language: 'markdown' },
];

export function createProjectFiles(extra = []) {
  return [...BASE_FILES, ...extra].map(file => ({ ...file, content: file.content ?? '' }));
}

export function upsertProjectFile(files, file) {
  const next = [...files];
  const index = next.findIndex(item => item.path === file.path);
  if (index >= 0) next[index] = { ...next[index], ...file };
  else next.push({ ...file, content: file.content ?? '' });
  return next;
}

export function removeProjectFile(files, path) {
  return files.filter(file => file.path !== path);
}

export function findProjectFile(files, path) {
  return files.find(file => file.path === path) ?? null;
}

export function buildFileTree(files) {
  const root = { name: 'Project', type: 'folder', children: [] };
  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let child = current.children.find(item => item.name === part);
      if (!child) {
        child = { name: part, type: isFile ? 'file' : 'folder', path: parts.slice(0, index + 1).join('/'), children: [] };
        current.children.push(child);
      }
      current = child;
    });
  }
  const sort = node => { node.children.sort((a,b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)); node.children.forEach(sort); };
  sort(root);
  return root;
}
