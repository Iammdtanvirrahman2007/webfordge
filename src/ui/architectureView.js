import { analyzeArchitecture, planFeature } from '../core/architecturePlanner.js';

export function createArchitectureView(graphProvider){
  const getGraph=typeof graphProvider==='function'?graphProvider:()=>graphProvider;
  const root=document.createElement('section');
  root.className='architecture-view';
  root.innerHTML=`<div class="architecture-head"><div><h2>Architecture</h2><p>Live map of the current WebForge project.</p></div><button class="architecture-close">Back to Visual</button></div><div class="architecture-grid"><div class="architecture-card"><h3>Project Health</h3><div id="archMetrics" class="arch-metrics"></div></div><div class="architecture-card"><h3>Feature Architect</h3><textarea id="featureRequest" placeholder="Describe a feature, e.g. Add login with API integration"></textarea><button id="planFeature" class="plan-btn">Plan Feature</button><div id="featurePlan"></div></div><div class="architecture-card wide"><h3>Proposed Structure</h3><div id="proposedFiles" class="proposed-files"></div></div><div class="architecture-card wide"><h3>Reusable Components</h3><div id="reusableComponents" class="reuse-list"></div></div></div>`;

  function render(){
    const analysis=analyzeArchitecture(getGraph());
    const metrics=root.querySelector('#archMetrics');
    metrics.innerHTML=`<div><strong>${analysis.metrics.pages}</strong><span>Pages</span></div><div><strong>${analysis.metrics.nodes}</strong><span>Nodes</span></div><div><strong>${analysis.metrics.reusableCandidates}</strong><span>Reusable</span></div><div><strong>${analysis.metrics.proposedFiles}</strong><span>Planned Files</span></div><div class="project-type"><strong>${analysis.projectType}</strong><span>Project Type</span></div>`;
    root.querySelector('#proposedFiles').innerHTML=analysis.proposedFiles.map(f=>`<div class="proposal"><span class="verb">${f.action}</span><code>${f.path}</code><small>${f.reason}</small></div>`).join('') || '<div class="empty">No files proposed.</div>';
    root.querySelector('#reusableComponents').innerHTML=analysis.reusableComponents.map(c=>`<div class="reuse-item"><strong>${c.name}</strong><span>${c.instances.length} instances</span><small>${c.reason}</small></div>`).join('') || '<div class="empty">No repeated structures detected yet.</div>';
  }
  root.querySelector('#planFeature').onclick=()=>{
    const request=root.querySelector('#featureRequest').value.trim();
    const result=planFeature(getGraph(),request);
    root.querySelector('#featurePlan').innerHTML=`<div class="plan-section"><h4>Create</h4>${result.create.map(x=>`<div>${x}</div>`).join('')||'<div>None</div>'}</div><div class="plan-section"><h4>Modify</h4>${result.modify.map(x=>`<div>${x}</div>`).join('')||'<div>None</div>'}</div><div class="plan-section"><h4>Reuse</h4>${result.reuse.map(x=>`<div>${x}</div>`).join('')||'<div>None</div>'}</div>${result.warnings.length?`<div class="plan-warning">${result.warnings.join('<br>')}</div>`:''}`;
  };
  root.querySelector('.architecture-close').onclick=()=>root.dispatchEvent(new CustomEvent('architecture:close',{bubbles:true}));
  render();
  root.refresh=render;
  return root;
}
