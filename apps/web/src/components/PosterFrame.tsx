import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { PresetId } from '../types';

export type PosterRatio = '1x1' | '4x5' | '9x16';

/**
 * Modular display ramp from §1 of the design bar. The fit routine picks the
 * largest step that satisfies the per-ratio line cap without horizontal
 * overflow. Values are in CSS px at the 1080-px frame scale (i.e. the export
 * resolution); the preview is scaled by the parent stage via a transform so the
 * ramp values stay constant regardless of viewport.
 */
const DISPLAY_STEPS = [40, 52, 68, 88, 112, 144, 180, 224] as const;

const RATIO_SPEC: Record<PosterRatio, { width: number; height: number; lineCap: number }> = {
  '1x1': { width: 1080, height: 1080, lineCap: 4 },
  '4x5': { width: 1080, height: 1350, lineCap: 5 },
  '9x16': { width: 1080, height: 1920, lineCap: 6 },
};

const SAFE_MARGIN_RATIO = 0.055;

export interface PosterFrameProps {
  ratio: PosterRatio;
  preset: PresetId;
  text: string;
  /** When true, paints safe-margin and ratio-band guides over the frame. */
  debugGrid?: boolean;
  className?: string;
}

/**
 * The poster surface. Renders at its true export size (1080 × ratio-height) so
 * the DOM node can be snapshotted directly; the preview stage scales it via a
 * CSS transform.
 */
export const PosterFrame = forwardRef<HTMLDivElement, PosterFrameProps>(function PosterFrame(
  { ratio, preset, text, debugGrid = false, className },
  forwardedRef,
) {
  const spec = RATIO_SPEC[ratio];
  const safeMargin = Math.round(Math.min(spec.width, spec.height) * SAFE_MARGIN_RATIO);
  const innerWidth = spec.width - 2 * safeMargin;

  const frameRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const measureRef = useRef<HTMLHeadingElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(DISPLAY_STEPS[DISPLAY_STEPS.length - 1]);

  // Expose the frame node to parents that need to snapshot it for PNG export.
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(
    forwardedRef,
    () => frameRef.current,
    [],
  );

  const displayText = text.trim().length > 0 ? text : ' ';

  const runFit = useCallback(() => {
    const measure = measureRef.current;
    if (!measure) return;
    const t0 = performance.now();
    const next = pickFontSize(measure, displayText, innerWidth, spec.lineCap);
    const elapsed = performance.now() - t0;
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && elapsed > 16) {
      // eslint-disable-next-line no-console
      console.warn(
        `[PosterFrame] fit ${elapsed.toFixed(1)}ms > 16ms budget`,
        { ratio, preset, length: displayText.length },
      );
    }
    setFontSize(next);
  }, [displayText, innerWidth, spec.lineCap, ratio, preset]);

  // Re-fit synchronously on text / ratio / preset change so the preview never
  // shows a stale size between frames.
  useLayoutEffect(() => {
    runFit();
  }, [runFit]);

  // Re-fit when the frame's box size changes (e.g. preset switch swaps font
  // family which can change metrics, or a parent unexpectedly resizes us).
  useEffect(() => {
    const node = frameRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => runFit());
    observer.observe(node);
    return () => observer.disconnect();
  }, [runFit]);

  // Re-fit once webfonts swap in — otherwise the very first paint can lock to a
  // size that no longer fits once the real glyphs land.
  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) runFit();
    });
    return () => {
      cancelled = true;
    };
  }, [runFit]);

  const frameStyle = useMemo<CSSProperties>(
    () =>
      ({
        width: spec.width,
        height: spec.height,
        '--pframe-w': `${spec.width}px`,
        '--pframe-h': `${spec.height}px`,
        '--pframe-safe-margin': `${safeMargin}px`,
      }) as CSSProperties,
    [spec.width, spec.height, safeMargin],
  );

  return (
    <div
      ref={frameRef}
      className={['poster-frame', className].filter(Boolean).join(' ')}
      data-ratio={ratio}
      data-preset={preset}
      data-debug-grid={debugGrid ? 'true' : undefined}
      style={frameStyle}
    >
      <div className="poster-frame__headline-slot">
        <h1
          ref={headlineRef}
          className="poster-frame__headline"
          style={{ fontSize: `${fontSize}px` }}
          data-font-step={fontSize}
        >
          {displayText}
        </h1>
      </div>

      <div className="poster-frame__watermark-slot">
        <span className="poster-frame__watermark">robware</span>
      </div>

      {debugGrid && <PosterFrameDebugOverlay ratio={ratio} />}

      {/* Hidden measure mirror. Inherits the headline's CSS so fontSize sweeps
          produce realistic line breaks (incl. text-wrap: balance) without
          flicker on the visible headline. */}
      <h1
        ref={measureRef}
        className="poster-frame__headline poster-frame__headline--measure"
        aria-hidden="true"
        style={
          {
            position: 'absolute',
            top: 0,
            left: '-99999px',
            visibility: 'hidden',
            pointerEvents: 'none',
            width: `${innerWidth}px`,
            maxWidth: `${innerWidth}px`,
          } as CSSProperties
        }
      />
    </div>
  );
});

function PosterFrameDebugOverlay({ ratio }: { ratio: PosterRatio }) {
  return (
    <div className="poster-frame__debug" aria-hidden="true">
      <div className="poster-frame__debug-safe" />
      {ratio === '4x5' && <div className="poster-frame__debug-line poster-frame__debug-line--third" />}
      {ratio === '9x16' && (
        <>
          <div className="poster-frame__debug-band poster-frame__debug-band--headline" />
          <div className="poster-frame__debug-band poster-frame__debug-band--watermark" />
        </>
      )}
    </div>
  );
}

/**
 * Walk the modular display ramp from largest to smallest and pick the largest
 * step that satisfies both:
 *   (a) lineCount ≤ ratio's line cap
 *   (b) no horizontal overflow (rendered width ≤ container)
 *
 * After the largest valid step is found, check the orphan-last-word condition:
 * if the final line is a single word, try one notch down — keep it only if the
 * orphan goes away. Otherwise accept the larger size (better gravitas usually
 * beats a perfect rag).
 *
 * Falls back to the smallest step (allowing vertical overflow into the bottom
 * safe-margin band) if nothing fits — the spec explicitly forbids truncation.
 */
export function pickFontSize(
  measure: HTMLElement,
  text: string,
  maxWidth: number,
  lineCap: number,
): number {
  measure.textContent = text;
  measure.style.width = `${maxWidth}px`;
  measure.style.maxWidth = `${maxWidth}px`;
  measure.style.textWrap = 'balance';

  const probe = (size: number): { lines: number; overflows: boolean } => {
    measure.style.fontSize = `${size}px`;
    // Force layout flush for the new size.
    void measure.offsetHeight;
    const rectHeight = measure.getBoundingClientRect().height;
    const lh = parseFloat(getComputedStyle(measure).lineHeight);
    const lineHeight = Number.isFinite(lh) && lh > 0 ? lh : size * 1.1;
    const lines = Math.max(1, Math.round(rectHeight / lineHeight));
    // Use scrollWidth to detect single-word overflow (one word longer than the
    // container can never wrap further). Add a 1-px tolerance to absorb
    // sub-pixel rounding from text-wrap: balance.
    const overflows = measure.scrollWidth > maxWidth + 1;
    return { lines, overflows };
  };

  for (let i = DISPLAY_STEPS.length - 1; i >= 0; i--) {
    const size = DISPLAY_STEPS[i];
    const { lines, overflows } = probe(size);
    if (lines <= lineCap && !overflows) {
      if (i > 0 && hasOrphanLastWord(measure)) {
        const downSize = DISPLAY_STEPS[i - 1];
        const downProbe = probe(downSize);
        if (
          downProbe.lines <= lineCap &&
          !downProbe.overflows &&
          !hasOrphanLastWord(measure)
        ) {
          return downSize;
        }
      }
      return size;
    }
  }
  return DISPLAY_STEPS[0];
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
    // Bounding rect of the last word.
    range.setStart(textNode, lastSpace + 1);
    range.setEnd(textNode, trimmed.length);
    const lastWordRects = range.getClientRects();
    if (lastWordRects.length === 0) return false;
    const lastTop = lastWordRects[0].top;
    // Bounding rect of the character immediately before the last space (i.e.
    // the tail of the previous word).
    range.setStart(textNode, Math.max(lastSpace - 1, 0));
    range.setEnd(textNode, lastSpace);
    const tailRects = range.getClientRects();
    if (tailRects.length === 0) return false;
    return Math.abs(tailRects[0].top - lastTop) > 2;
  } catch {
    return false;
  }
}

export const POSTER_FRAME_DIMENSIONS = RATIO_SPEC;
export const POSTER_FRAME_DISPLAY_STEPS = DISPLAY_STEPS;
