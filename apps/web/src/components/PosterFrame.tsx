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
import {
  POSTER_FRAME_DIMENSIONS,
  POSTER_FRAME_DISPLAY_STEPS,
  POSTER_FRAME_SAFE_MARGIN_RATIO,
  pickFontSize,
  type PosterRatio,
} from './posterFrame.fit';
import { Watermark } from './Watermark';

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
  const spec = POSTER_FRAME_DIMENSIONS[ratio];
  const safeMargin = Math.round(
    Math.min(spec.width, spec.height) * POSTER_FRAME_SAFE_MARGIN_RATIO,
  );
  const innerWidth = spec.width - 2 * safeMargin;
  // Pixel height of the headline slot — mirrors the CSS rules in styles.css:
  //   1x1   → top safeMargin, bottom safeMargin (full inner column)
  //   4x5   → top safeMargin, height calc(33.33% - safeMargin)
  //   9x16  → top safeMargin, height calc(40% - safeMargin)
  // Passing this to pickFontSize lets the fit routine enforce vertical fit, so
  // a large font with lines ≤ lineCap can't still overflow the slot vertically.
  const slotHeight =
    ratio === '1x1'
      ? spec.height - 2 * safeMargin
      : spec.height * spec.slotHeightRatio - safeMargin;

  const frameRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const measureRef = useRef<HTMLHeadingElement | null>(null);
  const [fontSize, setFontSize] = useState<number>(
    POSTER_FRAME_DISPLAY_STEPS[POSTER_FRAME_DISPLAY_STEPS.length - 1],
  );

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
    const next = pickFontSize(measure, displayText, innerWidth, spec.lineCap, slotHeight);
    const elapsed = performance.now() - t0;
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV && elapsed > 16) {
      console.warn(
        `[PosterFrame] fit ${elapsed.toFixed(1)}ms > 16ms budget`,
        { ratio, preset, length: displayText.length },
      );
    }
    setFontSize(next);
  }, [displayText, innerWidth, slotHeight, spec.lineCap, ratio, preset]);

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
        '--frame-w': `${spec.width}px`,
        '--frame-h': `${spec.height}px`,
        '--safe-margin': `${safeMargin}px`,
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

      <Watermark className="poster-frame__watermark" />

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
