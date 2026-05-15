import { afterEach, describe, expect, it, vi } from 'vitest';
import { fontsReady } from './fontsReady';

describe('fontsReady', () => {
  afterEach(() => {
    vi.useRealTimers();
    // Reset document.fonts between tests.
    delete (document as unknown as { fonts?: unknown }).fonts;
  });

  it('resolves immediately when document.fonts.ready is already ready', async () => {
    (document as unknown as { fonts: { ready: Promise<void> } }).fonts = {
      ready: Promise.resolve(),
    };
    await expect(fontsReady()).resolves.toBeUndefined();
  });

  it('resolves under the timeout when document.fonts.ready never settles', async () => {
    vi.useFakeTimers();
    (document as unknown as { fonts: { ready: Promise<void> } }).fonts = {
      ready: new Promise<void>(() => {}), // hangs forever
    };
    const promise = fontsReady(100);
    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves when document.fonts is absent', async () => {
    delete (document as unknown as { fonts?: unknown }).fonts;
    await expect(fontsReady()).resolves.toBeUndefined();
  });
});
