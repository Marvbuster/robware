import type { CSSProperties } from 'react';
import { Watermark } from '../Watermark';

type Preset = {
  name: string;
  paper: string;
  ink: string;
  mute: string;
  displayFace: string;
  // Per-face optical correction (see design bar §4).
  watermarkTracking?: string;
  watermarkOverhang?: string;
};

const PRESETS: Preset[] = [
  {
    name: 'Editorial',
    paper: '#F4EFE6',
    ink: '#161412',
    mute: '#7A6F62',
    displayFace: '"Fraunces", "Times New Roman", serif',
  },
  {
    name: 'Monolith',
    paper: '#0B0B0C',
    ink: '#F6F5F1',
    mute: '#6B6B6B',
    displayFace: '"Space Grotesk", "Inter", sans-serif',
  },
  {
    name: 'Salon',
    paper: '#F2D7D0',
    ink: '#2A1414',
    mute: '#8C5E55',
    displayFace: '"Instrument Serif", "Georgia", serif',
    watermarkTracking: '0.06em',
  },
  {
    name: 'Vapor',
    paper: '#1A1C22',
    ink: '#E8E6FF',
    mute: '#8E8AB8',
    displayFace: '"Space Grotesk", "Inter", sans-serif',
  },
];

type Ratio = { label: string; w: number; h: number };

// Scaled down so the 3×4 grid fits a 1440-wide viewport. The relative ratio
// is what matters; Watermark scales from --frame-w/--frame-h, not from any
// absolute breakpoint.
const RATIOS: Ratio[] = [
  { label: '1:1', w: 320, h: 320 },
  { label: '4:5', w: 320, h: 400 },
  { label: '9:16', w: 240, h: 427 },
];

function MockPosterFrame({
  preset,
  ratio,
  showGrid,
}: {
  preset: Preset;
  ratio: Ratio;
  showGrid: boolean;
}) {
  const safeMarginCalc = `calc(min(${ratio.w}px, ${ratio.h}px) * 0.055)`;

  const frameVars: CSSProperties = {
    '--frame-w': `${ratio.w}px`,
    '--frame-h': `${ratio.h}px`,
    '--safe-margin': safeMarginCalc,
    '--mute': preset.mute,
    '--display-face': preset.displayFace,
    '--watermark-tracking': preset.watermarkTracking ?? '0.08em',
    '--watermark-overhang': preset.watermarkOverhang ?? '0.04em',
    width: `${ratio.w}px`,
    height: `${ratio.h}px`,
    position: 'relative',
    background: preset.paper,
    color: preset.ink,
    overflow: 'hidden',
    fontFamily: preset.displayFace,
  } as CSSProperties;

  return (
    <div data-poster-frame style={frameVars}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: safeMarginCalc,
          display: 'flex',
          alignItems: 'flex-start',
          fontSize: 'calc(min(var(--frame-w), var(--frame-h)) * 0.085)',
          lineHeight: 1.06,
          fontWeight: 500,
          letterSpacing: '-0.02em',
        }}
      >
        <span style={{ textWrap: 'balance' as CSSProperties['textWrap'] }}>
          The shape of an idea before it has a name.
        </span>
      </div>
      {showGrid && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: safeMarginCalc,
            border: '1px dashed rgba(255, 0, 80, 0.55)',
            pointerEvents: 'none',
          }}
        />
      )}
      <Watermark />
    </div>
  );
}

export function WatermarkDemo({ showGrid }: { showGrid: boolean }) {
  return (
    <div style={{ background: '#0a0a0b', minHeight: '100vh', padding: '32px 24px' }}>
      <header style={{ color: '#9aa0a6', fontFamily: 'system-ui, sans-serif', marginBottom: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          ROB-10 · Watermark verification
        </div>
        <div style={{ fontSize: 13, marginTop: 6, color: '#6b7280' }}>
          4 presets × 3 ratios. Watermark scales from frame dimensions, inherits preset face + mute color.
          Add <code>?debug=grid</code> for safe-margin overlay.
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {PRESETS.map((preset) => (
          <section key={preset.name}>
            <h2
              style={{
                color: '#cbd5e1',
                fontFamily: 'system-ui, sans-serif',
                fontSize: 14,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                margin: '0 0 12px',
              }}
            >
              {preset.name}
              <span style={{ marginLeft: 12, color: '#6b7280', textTransform: 'none', letterSpacing: 0 }}>
                {preset.displayFace.split(',')[0].replace(/"/g, '')}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {RATIOS.map((ratio) => (
                <figure
                  key={ratio.label}
                  style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <MockPosterFrame preset={preset} ratio={ratio} showGrid={showGrid} />
                  <figcaption
                    style={{
                      color: '#6b7280',
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 11,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {ratio.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
