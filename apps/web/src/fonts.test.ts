import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cssPath = resolve(__dirname, './fonts.css');
const metricsPath = resolve(__dirname, './fonts.metrics.json');
const css = readFileSync(cssPath, 'utf8');
const metrics = JSON.parse(readFileSync(metricsPath, 'utf8')) as Record<
  string,
  {
    sizeAdjust: number;
    ascentOverride: number;
    descentOverride: number;
    lineGapOverride: number;
    fallback: string;
  }
>;

const expectedFaces = [
  { family: 'Fraunces', file: 'Fraunces-VF.woff2', style: 'normal' },
  { family: 'Fraunces', file: 'Fraunces-VF-Italic.woff2', style: 'italic' },
  {
    family: 'Instrument Serif',
    file: 'InstrumentSerif-Regular.woff2',
    style: 'normal',
  },
  {
    family: 'Instrument Serif',
    file: 'InstrumentSerif-Italic.woff2',
    style: 'italic',
  },
  { family: 'Space Grotesk', file: 'SpaceGrotesk-VF.woff2', style: 'normal' },
  { family: 'Inter', file: 'Inter-VF.woff2', style: 'normal' },
  { family: 'Inter', file: 'Inter-VF-Italic.woff2', style: 'italic' },
];

describe('fonts.css', () => {
  it('declares every required @font-face with woff2 + font-display: swap', () => {
    for (const { family, file, style } of expectedFaces) {
      expect(css).toContain(`font-family: '${family}';`);
      expect(css).toContain(`url('/fonts/${file}') format('woff2')`);
      expect(css).toMatch(new RegExp(`font-style:\\s*${style};`));
    }
    // Every declaration uses font-display: swap (no FOIT).
    const declarations = (css.match(/font-display:\s*swap;/g) ?? []).length;
    expect(declarations).toBe(expectedFaces.length);
  });

  it('carries matched fallback metric overrides on every face', () => {
    const overrideCount = (regex: RegExp) => (css.match(regex) ?? []).length;
    expect(overrideCount(/size-adjust:\s*[\d.]+%/g)).toBe(expectedFaces.length);
    expect(overrideCount(/ascent-override:\s*[\d.]+%/g)).toBe(expectedFaces.length);
    expect(overrideCount(/descent-override:\s*[\d.]+%/g)).toBe(expectedFaces.length);
    expect(overrideCount(/line-gap-override:\s*[\d.]+%/g)).toBe(expectedFaces.length);
  });

  it('exposes brand font tokens with fallback stacks', () => {
    expect(css).toContain("--font-fraunces: 'Fraunces', 'Times New Roman', Times, serif;");
    expect(css).toContain(
      "--font-inter: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;",
    );
    expect(css).toContain(
      "--font-instrument-serif: 'Instrument Serif', 'Times New Roman', Times, serif;",
    );
    expect(css).toContain(
      "--font-space-grotesk: 'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif;",
    );
  });

  it('exposes OpenType feature presets for poster + UI + watermark', () => {
    expect(css).toMatch(/\.ot-poster\b/);
    expect(css).toContain("'liga' 1");
    expect(css).toContain("'onum' 1");
    expect(css).toMatch(/\.ot-ui-numerals\b/);
    expect(css).toContain("'lnum' 1");
    expect(css).toContain("'tnum' 1");
    expect(css).toMatch(/\.ot-watermark\b/);
    expect(css).toContain("'smcp' 1");
    expect(css).toContain("'c2sc' 1");
  });
});

describe('fonts.metrics.json', () => {
  it('produces ascent/descent overrides in a sane range for every face', () => {
    for (const [key, m] of Object.entries(metrics)) {
      // Sanity: size-adjust within 50%–150% — anything outside means we are
      // tuning against the wrong fallback or the source file is broken.
      expect(m.sizeAdjust).toBeGreaterThan(0.5);
      expect(m.sizeAdjust).toBeLessThan(1.5);
      // Ascent/descent overrides land in the typographically plausible window
      // once size-adjust has been factored in. (Override percentages are >1
      // for tall display faces — this is expected.)
      expect(m.ascentOverride).toBeGreaterThan(0.5);
      expect(m.ascentOverride).toBeLessThan(2);
      expect(m.descentOverride).toBeGreaterThan(0.1);
      expect(m.descentOverride).toBeLessThan(0.6);
      // Times New Roman / Helvetica Neue are the only fallbacks we support.
      expect(['Times New Roman', 'Helvetica Neue']).toContain(m.fallback);
      // The metrics key matches a built woff2 file name.
      expect(key).toMatch(/^(Fraunces-VF|Fraunces-VF-Italic|InstrumentSerif-(Regular|Italic)|SpaceGrotesk-VF|Inter-VF|Inter-VF-Italic)$/);
    }
  });
});
