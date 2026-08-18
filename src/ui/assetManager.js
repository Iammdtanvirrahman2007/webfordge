import { createAssetRegistry, addAsset, listAssets, removeAsset } from '../core/assetManager.js';

const STORAGE_KEY='webforge-assets-v1';
const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'')||createAssetRegistry()}catch{return createAssetRegistry()}};
const save=registry=>localStorage.setItem(STORAGE_KEY,JSON.stringify(registry));
export function getAssetRegistry(){return load()}
export function openAssetManager(){
  const root=document.createElement('div'); root.className='webforge-overlay';
  root.innerHTML='<div class="webforge-modal"><div class="webforge-modal-head"><div class="webforge-modal-title">Assets</div><div class="webforge-modal-subtitle">Images, icons and project media</div><div class="webforge-modal-spacer"></div><button class="webforge-modal-close">Close</button></div><div class="webforge-modal-body"><div class="asset-toolbar"><button id="addAsset" class="primary">＋ Add asset</button><span class="asset-count"></span></div><div id="assetGrid" class="asset-grid"></div></div></div>';
  root.querySelector('.webforge-modal-close').onclick=()=>root.remove();
  root.onclick=e=>{if(e.target===root)root.remove()};
  document.body.appendChild(root);
  const grid=root.querySelector('#assetGrid'),count=root.querySelector('.asset-count');
  const render=()=>{const registry=load(),assets=listAssets(registry);count.textContent=`${assets.length} asset${assets.length===1?'':'s'}`;grid.innerHTML='';if(!assets.length){grid.innerHTML='<div class="asset-empty">No assets yet. Add an image URL to create one.</div>';return}assets.forEach(asset=>{const card=document.createElement('div');card.className='asset-card';card.innerHTML=`<div class="asset-preview">${asset.src?`<img src="${asset.src}" alt="">`:'<span>ASSET</span>'}</div><strong>${asset.name}</strong><code>${asset.path}</code><button class="asset-delete">Delete</button>`;card.querySelector('.asset-delete').onclick=()=>{save(removeAsset(load(),asset.id));render()};grid.appendChild(card)})};
  root.querySelector('#addAsset').onclick=()=>{const name=prompt('Asset name','Hero Image');if(!name)return;const src=prompt('Image URL','https://example.com/image.jpg');if(!src)return;save(addAsset(load(),{name,src,kind:'image',extension:(src.split('.').pop()||'jpg').split('?')[0]}));render()};
  render();
  return root;
}
export {STORAGE_KEY};
