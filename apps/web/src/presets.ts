import type { Aspect, Preset } from './types';

export const PRESETS: Preset[] = [
  {
    id: 'editorial',
    name: 'Editorial',
    tagline: 'Fraunces · cream · hairline rules',
    swatches: [
      'var(--color-editorial-paper)',
      'var(--color-editorial-ink)',
      'var(--color-editorial-accent)',
    ],
  },
  {
    id: 'monolith',
    name: 'Monolith',
    tagline: 'Space Grotesk · ink · gold',
    swatches: [
      'var(--color-monolith-paper)',
      'var(--color-monolith-ink)',
      'var(--color-monolith-accent)',
    ],
  },
  {
    id: 'salon',
    name: 'Salon',
    tagline: 'Instrument Serif italic · blush · oxblood',
    swatches: ['var(--color-salon-paper)', 'var(--color-salon-ink)', 'var(--color-salon-accent)'],
  },
  {
    id: 'vapor',
    name: 'Vapor',
    tagline: 'Inter · indigo · violet',
    swatches: ['var(--color-vapor-paper)', 'var(--color-vapor-ink)', 'var(--color-vapor-accent)'],
  },
];

export const ASPECTS: Aspect[] = [
  { id: 'square', ratio: '1x1', label: '1:1', hint: 'Square · feed', width: 1080, height: 1080 },
  {
    id: 'portrait',
    ratio: '4x5',
    label: '4:5',
    hint: 'Portrait · feed',
    width: 1080,
    height: 1350,
  },
  { id: 'story', ratio: '9x16', label: '9:16', hint: 'Story · reels', width: 1080, height: 1920 },
];

export const DEFAULT_TEXT = 'The thing you keep almost saying. Say it. Set it. Ship it.';
