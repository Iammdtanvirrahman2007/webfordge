const clone = value => structuredClone(value ?? {});
const slugify = value => String(value || 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'asset';

export function createAssetRegistry(){ return { version:1, assets:{} }; }
export function addAsset(registry, options={}){
  const id=options.id || `asset_${Date.now().toString(36)}`;
  const name=options.name || 'Asset';
  const kind=options.kind || 'image';
  const extension=options.extension || 'png';
  const next=clone(registry);
  if(next.assets[id]) throw new Error(`Asset already exists: ${id}`);
  next.assets[id]={id,name,slug:slugify(name),kind,extension,path:options.path || `frontend/assets/${slugify(name)}.${extension}`,src:options.src || '',alt:options.alt || name,width:options.width || null,height:options.height || null};
  return next;
}
export function getAsset(registry,id){ return registry.assets[id] ?? null; }
export function listAssets(registry){ return Object.values(registry.assets); }
export function removeAsset(registry,id){ if(!registry.assets[id]) return registry; const next=clone(registry); delete next.assets[id]; return next; }
export function updateAsset(registry,id,patch){ if(!registry.assets[id]) return registry; const next=clone(registry); next.assets[id]={...next.assets[id],...clone(patch)}; return next; }
export function assetReference(asset){ return asset?.path || asset?.src || ''; }
