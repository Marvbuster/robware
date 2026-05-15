import { DEFAULT_TEXT, EXAMPLE_TEXTS, pickExampleText } from './presets';

describe('pickExampleText', () => {
  it('returns a member of EXAMPLE_TEXTS for any seed in [0, 1)', () => {
    for (const seed of [0, 0.1, 0.25, 0.5, 0.75, 0.99]) {
      expect(EXAMPLE_TEXTS).toContain(pickExampleText(seed));
    }
  });

  it('keeps the original DEFAULT_TEXT in the rotation', () => {
    expect(EXAMPLE_TEXTS).toContain(DEFAULT_TEXT);
  });

  it('exposes 8 example texts (design bar §5)', () => {
    expect(EXAMPLE_TEXTS).toHaveLength(8);
  });

  it('maps each ramp slot to a distinct entry', () => {
    const seen = new Set<string>();
    for (let i = 0; i < EXAMPLE_TEXTS.length; i++) {
      const seed = (i + 0.5) / EXAMPLE_TEXTS.length;
      seen.add(pickExampleText(seed));
    }
    expect(seen.size).toBe(EXAMPLE_TEXTS.length);
  });

  it('clamps gracefully at the upper bound (seed=1)', () => {
    expect(EXAMPLE_TEXTS).toContain(pickExampleText(1));
  });
});
