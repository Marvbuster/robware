import type { CSSProperties } from 'react';

const WATERMARK_TEXT = 'robware';

type WatermarkProps = {
  className?: string;
  style?: CSSProperties;
};

/**
 * The robware wordmark. Renders inside PosterFrame and inherits the active
 * preset's display face + --mute color. v0 has no opt-out — the watermark is
 * part of the type system, not an overlay.
 *
 * Consumed CSS variables (set by PosterFrame + the active preset):
 *   --frame-w, --frame-h         frame dimensions in px
 *   --safe-margin                 5.5% of shortest edge, set by PosterFrame
 *   --mute                        preset's mute color token
 *   --display-face                preset's display font family
 *   --watermark-tracking          per-face tracking override (default 0.08em)
 *   --watermark-overhang          per-face optical right-edge overhang (default 0.04em)
 */
export function Watermark({ className, style }: WatermarkProps = {}) {
  return (
    <span
      data-watermark="robware"
      aria-label="robware"
      className={className}
      style={
        {
          position: 'absolute',
          bottom: 'var(--safe-margin, calc(min(var(--frame-w, 100%), var(--frame-h, 100%)) * 0.055))',
          right: 'var(--safe-margin, calc(min(var(--frame-w, 100%), var(--frame-h, 100%)) * 0.055))',
          fontFamily: 'var(--display-face, "Fraunces", "Instrument Serif", "Space Grotesk", serif)',
          fontSize: 'calc(min(var(--frame-w, 100%), var(--frame-h, 100%)) * 0.014)',
          fontWeight: 500,
          color: 'var(--mute, #7a6f62)',
          letterSpacing: 'var(--watermark-tracking, 0.08em)',
          lineHeight: 1,
          fontFeatureSettings: '"smcp", "c2sc", "kern"',
          fontVariantCaps: 'all-small-caps',
          textRendering: 'geometricPrecision',
          WebkitFontSmoothing: 'antialiased',
          marginRight: 'calc(var(--watermark-overhang, 0.04em) * -1)',
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          ...style,
        } as CSSProperties
      }
    >
      {WATERMARK_TEXT}
    </span>
  );
}
