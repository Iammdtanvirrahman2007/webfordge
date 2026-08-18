const slugify = (value='') => String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'page';

const unique = values => [...new Set(values.filter(Boolean))];

function collectNodes(graph, rootId, out=[]){
  const root=graph.entities[rootId]; if(!root) return out;
  out.push(root);
  (root.children||[]).forEach(id=>collectNodes(graph,id,out));
  return out;
}

function classifyProject(graph){
  const entities=Object.values(graph.entities||{});
  const pages=entities.filter(e=>e.type==='page').length;
  const hasApi=entities.some(e=>e.type==='api');
  const hasData=entities.some(e=>e.type==='data');
  if(hasApi||hasData) return 'full-stack-application';
  if(pages>1) return 'frontend-application';
  return 'static-website';
}

function componentCandidates(nodes){
  const signatures=new Map();
  for(const node of nodes.filter(n=>n.type==='element')){
    const type=node.data?.type||node.type;
    const content=String(node.data?.content||'').replace(/\s+/g,' ').trim();
    const key=`${type}|${content}`;
    const list=signatures.get(key)||[];
    list.push(node);
    signatures.set(key,list);
  }
  return [...signatures.values()].filter(group=>group.length>1).map(group=>({
    name:`${group[0].name.replace(/\s+/g,'')}Shared`,
    type:group[0].data?.type||group[0].type,
    instances:group.map(node=>node.id),
    reason:'Repeated visual structure can be extracted into a reusable component.'
  }));
}

function fileForElement(node, page){
  const type=node.data?.type||node.type;
  if(type==='section') return `frontend/components/${slugify(node.name)}.html`;
  return `frontend/pages/${slugify(page.name)}.html`;
}

export function analyzeArchitecture(graph){
  const pages=Object.values(graph.entities||{}).filter(e=>e.type==='page');
  const allNodes=unique(pages.flatMap(page=>collectNodes(graph,page.id))).filter(Boolean);
  const projectType=classifyProject(graph);
  const reused=componentCandidates(allNodes);
  const proposedFiles=[];
  pages.forEach((page,index)=>{
    proposedFiles.push({action:'create',path:`frontend/pages/${index===0?'index':slugify(page.name)}.html`,reason:'Page source'});
  });
  proposedFiles.push({action:'create',path:'frontend/css/global.css',reason:'Shared visual styles'});
  proposedFiles.push({action:'create',path:'frontend/js/app.js',reason:'Shared browser logic'});
  reused.forEach(component=>proposedFiles.push({action:'create',path:`frontend/components/${slugify(component.name)}.html`,reason:'Reusable repeated structure'}));
  if(projectType==='full-stack-application'){
    proposedFiles.push({action:'create',path:'backend/routes/index.js',reason:'Backend route boundary'});
    proposedFiles.push({action:'create',path:'backend/services/index.js',reason:'Backend service boundary'});
  }
  const warnings=[];
  if(allNodes.length>40) warnings.push('Large visual tree: consider extracting reusable components.');
  if(reused.length) warnings.push(`${reused.length} repeated structure group(s) can be reused.`);
  return {
    projectType,
    metrics:{pages:pages.length,nodes:allNodes.length,reusableCandidates:reused.length,proposedFiles:proposedFiles.length},
    reusableComponents:reused,
    proposedFiles,
    warnings,
  };
}

export function planFeature(graph, request=''){
  const text=String(request).toLowerCase();
  const analysis=analyzeArchitecture(graph);
  const create=[]; const modify=[]; const reuse=[];
  const wantsAuth=/login|register|auth|authentication|sign.?in/.test(text);
  const wantsApi=/api|server|backend|database|data/.test(text);
  const wantsDashboard=/dashboard|admin panel|admin/.test(text);
  const existingNames=Object.values(graph.entities||{}).filter(e=>e.type==='component').map(e=>e.name.toLowerCase());
  if(wantsAuth){create.push('frontend/pages/login.html','frontend/services/authService.js');reuse.push(...existingNames.filter(n=>/button|form|input/.test(n)))}
  if(wantsApi){create.push('frontend/services/api.js','backend/routes/index.js','backend/services/index.js')}
  if(wantsDashboard) create.push('frontend/pages/dashboard.html','frontend/components/sidebar.html');
  if(!create.length){
    const page=Object.values(graph.entities||{}).find(e=>e.type==='page');
    create.push(`frontend/pages/${page?slugify(page.name):'new-feature'}.html`);
  }
  if(analysis.reusableComponents.length) reuse.push(...analysis.reusableComponents.map(c=>c.name));
  if(pagesHavePotentialModify(graph,text)) modify.push('frontend/app.js');
  return {request,projectType:analysis.projectType,create:unique(create),modify:unique(modify),reuse:unique(reuse),warnings:analysis.warnings};
}

function pagesHavePotentialModify(graph,text){
  const pages=Object.values(graph.entities||{}).filter(e=>e.type==='page');
  return pages.length>0 && /nav|route|global|theme|api|login|dashboard/.test(text);
}
