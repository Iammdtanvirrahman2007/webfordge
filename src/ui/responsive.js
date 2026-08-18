export const VIEWPORTS = {
  desktop: { label: 'Desktop', width: 1200 },
  tablet: { label: 'Tablet', width: 768 },
  mobile: { label: 'Mobile', width: 390 },
};

export function getViewport(name = 'desktop') {
  return VIEWPORTS[name] ?? VIEWPORTS.desktop;
}
