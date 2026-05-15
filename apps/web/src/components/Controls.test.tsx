import { clampPosterText, POSTER_TEXT_MAX } from './Controls';

describe('clampPosterText (Defect C — word-boundary truncation)', () => {
  it('leaves short input untouched', () => {
    const text = 'Set it. Ship it.';
    expect(clampPosterText(text)).toBe(text);
  });

  it('returns input unchanged at exactly the cap', () => {
    const text = 'a'.repeat(POSTER_TEXT_MAX);
    expect(clampPosterText(text)).toBe(text);
  });

  it('drops the trailing partial word when the cap lands mid-word', () => {
    const text =
      'The thing you keep almost saying. Say it. Set it. Ship it. ' +
      'The thing you keep almost saying. Say it. Set it. Ship it. ' +
      'The thing you keep almost saying. Say it. Set it. Ship it. ' +
      'Keep going, do not back down without saying it now today again here.';
    expect(text.length).toBeGreaterThan(POSTER_TEXT_MAX);
    const clamped = clampPosterText(text);
    expect(clamped.length).toBeLessThanOrEqual(POSTER_TEXT_MAX);
    expect(clamped).not.toMatch(/\s$/);
    const next = text.charAt(clamped.length);
    expect(next === '' || /\s/.test(next)).toBe(true);
    expect(text.startsWith(clamped)).toBe(true);
  });

  it('preserves a clean cut when the cap lands on whitespace', () => {
    const head = 'a'.repeat(POSTER_TEXT_MAX - 1);
    const text = `${head} extra`;
    const clamped = clampPosterText(text);
    expect(clamped.length).toBeLessThanOrEqual(POSTER_TEXT_MAX);
    expect(clamped).toBe(head);
  });

  it('hard-cuts at the cap when a single word exceeds it', () => {
    const text = 'x'.repeat(POSTER_TEXT_MAX + 50);
    const clamped = clampPosterText(text);
    expect(clamped.length).toBe(POSTER_TEXT_MAX);
  });
});
