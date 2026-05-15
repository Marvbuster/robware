/**
 * Headline fit-to-frame algorithm for PosterFrame.
 *
 * Lives in its own file so PosterFrame.tsx only exports the React component —
 * keeps Fast Refresh happy and isolates the layout math for unit testing.
 */

export type PosterRatio = '1x1' | '4x5' | '9x16';

/**
 * Per-ratio frame spec. `slotHeightRatio` is the fraction of frame height the
 * headline slot occupies (matches the CSS rules in styles.css for each ratio).
 * The fit routine uses this to enforce a vertical fit constraint — otherwise
 * a large size with line count ≤ lineCap can still overflow the slot vertically
 * because line-height × lineCap may exceed the slot's pixel height.
 */
export const POSTER_FRAME_DIMENSIONS: Record<
  PosterRatio,
  { width: number; height: number; lineCap: number; slotHeightRatio: number }
> = {
  '1x1': { width: 1080, height: 1080, lineCap: 4, slotHeightRatio: 1 },
  '4x5': { width: 1080, height: 1350, lineCap: 5, slotHeightRatio: 0.3333 },
  '9x16': { width: 1080, height: 1920, lineCap: 6, slotHeightRatio: 0.4 },
};

/**
 * Modular display ramp from §1 of the design bar. The fit routine walks this
 * from largest to smallest, picking the first step that satisfies the per-ratio
 * line cap without horizontal overflow. Values are in CSS px at the 1080-px
 * frame scale (i.e. export resolution).
 */
export const POSTER_FRAME_DISPLAY_STEPS = [40, 52, 68, 88, 112, 144, 180, 224] as const;

export const POSTER_FRAME_SAFE_MARGIN_RATIO = 0.055;

/**
 * Walk the modular ramp from largest to smallest and pick the largest step
 * that satisfies:
 *   (a) lineCount ≤ ratio's line cap
 *   (b) no horizontal overflow (rendered width ≤ container)
 *
 * After the largest valid step is found, check the orphan-last-word condition:
 * if the final line is a single word, try one notch down — keep it only if the
 * orphan goes away. Otherwise accept the larger size (gravitas usually beats a
 * perfect rag).
 *
 * Falls back to the smallest step (allowing vertical overflow into the bottom
 * safe-margin band) if nothing fits — the spec explicitly forbids truncation.
 */
export function pickFontSize(
  measure: HTMLElement,
  text: string,
  maxWidth: number,
  lineCap: number,
  maxHeight: number = Number.POSITIVE_INFINITY,
): number {
  measure.textContent = text;
  measure.style.width = `${maxWidth}px`;
  measure.style.maxWidth = `${maxWidth}px`;
  measure.style.textWrap = 'balance';

  const probe = (
    size: number,
  ): { lines: number; overflows: boolean; height: number } => {
    measure.style.fontSize = `${size}px`;
    // offsetHeight is the unscaled layout-box height in CSS pixels.
    // getBoundingClientRect() returns transformed bounds — the measure mirror
    // lives inside .stage-scaler which has transform: scale(), so rect height
    // would be in scaled units while maxHeight/line-height are unscaled.
    const rectHeight = measure.offsetHeight;
    const lh = parseFloat(getComputedStyle(measure).lineHeight);
    const lineHeight = Number.isFinite(lh) && lh > 0 ? lh : size * 1.1;
    const lines = Math.max(1, Math.round(rectHeight / lineHeight));
    const overflows = measure.scrollWidth > maxWidth + 1;
    return { lines, overflows, height: rectHeight };
  };

  for (let i = POSTER_FRAME_DISPLAY_STEPS.length - 1; i >= 0; i--) {
    const size = POSTER_FRAME_DISPLAY_STEPS[i];
    const { lines, overflows, height } = probe(size);
    if (lines <= lineCap && !overflows && height <= maxHeight) {
      if (i > 0 && hasOrphanLastWord(measure)) {
        const downSize = POSTER_FRAME_DISPLAY_STEPS[i - 1];
        const downProbe = probe(downSize);
        if (
          downProbe.lines <= lineCap &&
          !downProbe.overflows &&
          downProbe.height <= maxHeight &&
          !hasOrphanLastWord(measure)
        ) {
          return downSize;
        }
      }
      return size;
    }
  }
  return POSTER_FRAME_DISPLAY_STEPS[0];
}

/**
 * Returns true when the rendered last line contains a single word. Uses the
 * Range API to compare the y-position of the last word against the word before
 * it — same y-top means they share a line, different y-top means the last word
 * is alone.
 */
export function hasOrphanLastWord(node: HTMLElement): boolean {
  const textNode = node.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return false;
  const text = textNode.textContent ?? '';
  const trimmed = text.replace(/\s+$/, '');
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace < 0) return false;
  if (typeof document.createRange !== 'function') return false;

  const range = document.createRange();
  try {
    range.setStart(textNode, lastSpace + 1);
    range.setEnd(textNode, trimmed.length);
    const lastWordRects = range.getClientRects();
    if (lastWordRects.length === 0) return false;
    const lastTop = lastWordRects[0].top;
    range.setStart(textNode, Math.max(lastSpace - 1, 0));
    range.setEnd(textNode, lastSpace);
    const tailRects = range.getClientRects();
    if (tailRects.length === 0) return false;
    return Math.abs(tailRects[0].top - lastTop) > 2;
  } catch {
    return false;
  }
}
