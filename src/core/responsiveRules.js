export const RESPONSIVE_MODES = Object.freeze({
  LOCK: 'lock-layout',
  AUTO: 'auto-adjust',
  INDIVIDUAL: 'make-individually'
});

export const DEVICE_KEYS = Object.freeze(['desktop', 'tablet', 'mobile']);

export function normalizeResponsive(data = {}) {
  return {
    mode: data.mode || RESPONSIVE_MODES.AUTO,
    styles: {
      desktop: { ...(data.styles?.desktop || {}) },
      tablet: { ...(data.styles?.tablet || {}) },
      mobile: { ...(data.styles?.mobile || {}) }
    }
  };
}

export function setResponsiveMode(nodeData = {}, mode) {
  if (!Object.values(RESPONSIVE_MODES).includes(mode)) throw new Error(`Unknown responsive mode: ${mode}`);
  return { ...nodeData, responsive: normalizeResponsive({ ...(nodeData.responsive || {}), mode }) };
}

export function setDeviceStyles(nodeData = {}, device, styles = {}) {
  if (!DEVICE_KEYS.includes(device)) throw new Error(`Unknown device: ${device}`);
  const responsive = normalizeResponsive(nodeData.responsive || {});
  responsive.styles[device] = { ...responsive.styles[device], ...styles };
  return { ...nodeData, responsive };
}

export function getEffectiveStyles(nodeData = {}, device) {
  const responsive = normalizeResponsive(nodeData.responsive || {});
  const base = { ...(nodeData.styles || {}) };
  if (responsive.mode === RESPONSIVE_MODES.INDIVIDUAL) return { ...base, ...responsive.styles[device] };
  if (responsive.mode === RESPONSIVE_MODES.LOCK) return base;
  const deviceStyles = responsive.styles[device] || {};
  return { ...base, ...deviceStyles };
}
