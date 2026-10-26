export const BRAND = {
  bg: '#050507',
  fg: '#e4e2df',
  muted: 'rgba(228,226,223,0.45)',
  border: 'rgba(228,226,223,0.07)',
  accent: '#22c55e',
  accentBright: '#4ade80',
  accentGlow: 'rgba(34,197,94,0.18)',
  signal: '#10b981',
  cardBg: 'rgba(6,7,6,0.66)',
  chrome: '#060608',
} as const;

export const MATERIALS_3D = {
  voidBg: 0x050507,
  fogColor: 0x060809,
  anodizedDark: 0x111419,
  anodizedMid: 0x1b2028,
  brushedMetal: 0x2a313c,
  mattePolymer: 0x0c0e12,
  darkGlass: 0x08120e,
  siliconDie: 0x0c1914,
  emeraldSignal: 0x22c55e,
  emeraldBright: 0x4ade80,
  amberExperimental: 0xf59e0b,
  redContained: 0xef4444,
  blueVector: 0x38bdf8,
  warmHighlight: 0xe4e2df,
} as const;

export const MOTION = {
  cameraDamping: 4.2,
  unfoldSpeed: 3.4,
  revealEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  maxMobilePixelRatio: 1.5,
  maxDesktopPixelRatio: 2.0,
} as const;
