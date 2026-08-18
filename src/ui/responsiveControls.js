const STORAGE_KEY = 'webforge-responsive-modes-v1';
const MODES = ['lock-layout', 'auto-adjust', 'make-individually'];
const DEVICES = ['desktop', 'tablet', 'mobile'];
const STYLE_KEYS = ['width','minHeight','position','left','top','padding','margin','flexDirection','gap','gridTemplateColumns','background','color','borderRadius'];

const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; } };
const save = value => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
const device = () => document.querySelector('[data-device].active')?.dataset.device || 'desktop';
const selected = () => document.querySelector('#canvas .forge-node.selected');
const snapshot = el => Object.fromEntries(STYLE_KEYS.map(key => [key, el.style[key] || '']));

function ensureEntry(id, el) {
  const all = load();
  if (!all[id]) all[id] = { mode: 'auto-adjust', base: snapshot(el), styles: { desktop: snapshot(el), tablet: {}, mobile: {} } };
  return all;
}

function apply(id) {
  const el = selected();
  if (!el || el.dataset.id !== id) return;
  const all = ensureEntry(id, el), entry = all[id], mode = entry.mode, currentDevice = device();
  if (mode === 'lock-layout') Object.assign(el.style, entry.base || {});
  if (mode === 'auto-adjust') {
    Object.assign(el.style, entry.base || {});
    el.style.maxWidth = '100%';
    el.style.boxSizing = 'border-box';
    if (currentDevice === 'mobile') {
      if (el.style.padding) el.style.padding = 'min(18px, 4vw)';
      if (el.style.margin) el.style.margin = 'min(18px, 4vw)';
    }
  }
  if (mode === 'make-individually') {
    const custom = entry.styles?.[currentDevice] || {};
    Object.assign(el.style, entry.base || {}, custom);
  }
  save(all);
}

function setMode(mode) {
  if (!MODES.includes(mode)) return;
  const el = selected();
  if (!el?.dataset.id) return;
  const all = ensureEntry(el.dataset.id, el), current = all[el.dataset.id], currentDevice = device();
  current.mode = mode;
  current.styles ||= { desktop: {}, tablet: {}, mobile: {} };
  if (mode === 'make-individually' && Object.keys(current.styles[currentDevice] || {}).length === 0) current.styles[currentDevice] = snapshot(el);
  save(all);
  apply(el.dataset.id);
  renderState();
}

function renderState() {
  const el = selected();
  const mode = el?.dataset.id ? (load()[el.dataset.id]?.mode || 'auto-adjust') : null;
  document.querySelectorAll('[data-responsive-mode]').forEach(button => button.classList.toggle('active', button.dataset.responsiveMode === mode));
  const status = document.querySelector('#responsiveStatus');
  if (status) status.textContent = mode ? mode.replaceAll('-', ' ') : 'Select an element';
}

function mount() {
  const toolbar = document.querySelector('#responsiveControls');
  if (!toolbar) return;
  toolbar.addEventListener('click', event => { const button = event.target.closest('[data-responsive-mode]'); if (button) setMode(button.dataset.responsiveMode); });
  document.querySelectorAll('[data-device]').forEach(button => button.addEventListener('click', () => setTimeout(() => { const el = selected(); if (el?.dataset.id) apply(el.dataset.id); renderState(); }, 0)));
  window.addEventListener('webforge:graphchange', () => setTimeout(() => { const el = selected(); if (el?.dataset.id) apply(el.dataset.id); renderState(); }, 0));
  const observer = new MutationObserver(() => setTimeout(renderState, 0));
  const canvas = document.querySelector('#canvas');
  if (canvas) observer.observe(canvas, { childList: true, subtree: true });
  renderState();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

export { MODES, setMode, renderState };
