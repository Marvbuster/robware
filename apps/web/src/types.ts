export type PresetId = 'editorial' | 'monolith' | 'salon' | 'vapor';

export type AspectId = 'square' | 'portrait' | 'story';

export type PosterRatioId = '1x1' | '4x5' | '9x16';

export interface Aspect {
  id: AspectId;
  /** Ratio token consumed by PosterFrame. */
  ratio: PosterRatioId;
  label: string;
  hint: string;
  width: number;
  height: number;
}

export interface Preset {
  id: PresetId;
  name: string;
  tagline: string;
  // Swatches for the preset picker, expressed as CSS values that resolve to
  // design tokens declared in styles.css under @theme. Components consume them
  // via inline `background:` — no hex literal ever appears in a .tsx file.
  swatches: [string, string, string];
}
