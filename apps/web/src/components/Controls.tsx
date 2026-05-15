import type { Aspect, AspectId, Preset, PresetId } from '../types';

export const POSTER_TEXT_MAX = 240;

/**
 * Hard-stop the textarea at {@link POSTER_TEXT_MAX} characters on a word
 * boundary. Pasting a long sentence used to chop mid-word (e.g. "…down withou")
 * which reads as silent data loss. We drop the trailing partial word so users
 * always see a clean end-of-sentence; if a single word is itself longer than
 * the cap, we still hard-cut at the cap as a last resort.
 */
export function clampPosterText(input: string, max: number = POSTER_TEXT_MAX): string {
  if (input.length <= max) return input;
  const head = input.slice(0, max);
  if (/\s/.test(input.charAt(max))) return head.replace(/\s+$/, '');
  const lastSpace = head.search(/\s\S*$/);
  if (lastSpace > 0) return head.slice(0, lastSpace);
  return head;
}

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
            {text.length}/{POSTER_TEXT_MAX}
          </span>
        </label>
        <textarea
          id="poster-text"
          className="controls-textarea"
          value={text}
          onChange={(e) => onTextChange(clampPosterText(e.target.value))}
          maxLength={POSTER_TEXT_MAX}
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
          aria-busy={isDownloading || undefined}
        >
          {isDownloading ? 'Rendering…' : 'Download'}
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
