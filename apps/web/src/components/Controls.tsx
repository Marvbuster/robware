import type { Aspect, AspectId, Preset, PresetId } from '../types';

interface ControlsProps {
  text: string;
  onTextChange: (next: string) => void;
  presets: Preset[];
  preset: PresetId;
  onPresetChange: (next: PresetId) => void;
  aspects: Aspect[];
  aspect: AspectId;
  onAspectChange: (next: AspectId) => void;
  onDownload: () => void;
  isDownloading: boolean;
  downloadError: string | null;
}

export function Controls({
  text,
  onTextChange,
  presets,
  preset,
  onPresetChange,
  aspects,
  aspect,
  onAspectChange,
  onDownload,
  isDownloading,
  downloadError,
}: ControlsProps) {
  return (
    <aside className="controls" aria-label="Poster controls">
      <header className="controls-header">
        <div className="controls-eyebrow">
          <span className="controls-eyebrow-dot" aria-hidden="true" />
          <span>robware · poster</span>
        </div>
        <h1 className="controls-title">
          Type a sentence. <span className="controls-title-soft">Get a poster.</span>
        </h1>
        <p className="controls-lede">
          Editorial typography, four hand-tuned looks, three social aspects. No account, no upload,
          no fuss — your text never leaves the browser.
        </p>
      </header>

      <section className="controls-section">
        <label htmlFor="poster-text" className="controls-label">
          Your text
          <span className="controls-label-count" aria-live="polite">
            {text.length}/240
          </span>
        </label>
        <textarea
          id="poster-text"
          className="controls-textarea"
          value={text}
          onChange={(e) => onTextChange(e.target.value.slice(0, 240))}
          maxLength={240}
          rows={4}
          placeholder="Write the sentence worth setting…"
          spellCheck
        />
      </section>

      <section className="controls-section">
        <span className="controls-label">Style</span>
        <div className="preset-grid" role="radiogroup" aria-label="Style preset">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={p.id === preset}
              className="preset-card"
              data-active={p.id === preset}
              onClick={() => onPresetChange(p.id)}
            >
              <span className="preset-swatches" aria-hidden="true">
                {p.swatches.map((c, i) => (
                  <span key={i} style={{ background: c }} />
                ))}
              </span>
              <span className="preset-meta">
                <span className="preset-name">{p.name}</span>
                <span className="preset-tagline">{p.tagline}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="controls-section">
        <span className="controls-label">Format</span>
        <div className="aspect-row" role="radiogroup" aria-label="Aspect ratio">
          {aspects.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={a.id === aspect}
              className="aspect-chip"
              data-active={a.id === aspect}
              onClick={() => onAspectChange(a.id)}
            >
              <span className="aspect-label">{a.label}</span>
              <span className="aspect-hint">{a.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="controls-section controls-actions">
        <button
          type="button"
          className="download-button"
          onClick={onDownload}
          disabled={isDownloading}
        >
          {isDownloading ? 'Rendering…' : 'Download PNG'}
        </button>
        {downloadError && (
          <p className="download-error" role="alert">
            {downloadError}
          </p>
        )}
        <p className="controls-fineprint">
          Fonts: Fraunces · Instrument Serif · Space Grotesk · Inter. Renders at full social
          resolution (1080 short edge).
        </p>
      </section>
    </aside>
  );
}
