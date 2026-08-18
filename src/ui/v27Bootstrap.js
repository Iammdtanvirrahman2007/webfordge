import { openPageMap } from './pageMapV27.js';
import './pageBranchController.js';
import './navigationEditor.js';
import './navigationBranchTargets.js';

function getNavigationGraph(){
  try { return JSON.parse(localStorage.getItem('webforge-navigation-v1')||'') || {version:1,edges:{}}; }
  catch { return {version:1,edges:{}}; }
}
function mount(){
  window.webforge=window.webforge||{};
  window.webforge.getNavigationGraph=getNavigationGraph;
  const actions=document.querySelector('.actions');
  if(actions&&!document.querySelector('#pageMapBtn')){
    const button=document.createElement('button'); button.id='pageMapBtn'; button.textContent='Page Map'; button.onclick=()=>openPageMap();
    actions.insertBefore(button,actions.querySelector('#previewBtn')||null);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
