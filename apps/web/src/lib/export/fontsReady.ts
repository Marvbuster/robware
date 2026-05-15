/**
 * Resolve when web fonts have settled, or after `timeoutMs` — whichever comes
 * first. The timeout exists because a never-resolving `document.fonts.ready`
 * would block the export indefinitely; the 1500 ms ceiling is far above the
 * preload budget so a healthy app never hits it.
 */
export async function fontsReady(timeoutMs = 1500): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.ready) return;
  await Promise.race([
    document.fonts.ready.then(() => undefined),
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}
