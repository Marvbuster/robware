import { useCallback, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Controls } from './components/Controls';
import { PosterStage } from './components/PosterStage';
import { WatermarkDemo } from './components/__demo__/WatermarkDemo';
import { ASPECTS, DEFAULT_TEXT, PRESETS } from './presets';
import type { AspectId, PresetId } from './types';

// Read ?preset= / ?aspect= so a poster look is shareable as a URL. Falls back
// silently if the value is unknown or we're rendering server-side.
function readInitial<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const value = new URLSearchParams(window.location.search).get(key);
  return (allowed as readonly string[]).includes(value ?? '') ? (value as T) : fallback;
}

// ?debug=grid paints the safe-margin and ratio-band guides over the frame so
// the next visual review pass can verify alignment.
function readDebugGrid(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('debug') === 'grid';
}

function readDemo(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('demo');
}

const PRESET_IDS = PRESETS.map((p) => p.id) as readonly PresetId[];
const ASPECT_IDS = ASPECTS.map((a) => a.id) as readonly AspectId[];

export function App() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [presetId, setPresetId] = useState<PresetId>(() =>
    readInitial('preset', PRESET_IDS, 'editorial'),
  );
  const [aspectId, setAspectId] = useState<AspectId>(() =>
    readInitial('aspect', ASPECT_IDS, 'portrait'),
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const debugGrid = readDebugGrid();
  const demo = readDemo();

  const posterRef = useRef<HTMLDivElement | null>(null);
  const aspect = ASPECTS.find((a) => a.id === aspectId) ?? ASPECTS[0];

  const handleDownload = useCallback(async () => {
    const node = posterRef.current;
    if (!node) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        width: aspect.width,
        height: aspect.height,
        style: { transform: 'none' },
      });
      const link = document.createElement('a');
      link.download = `robware-poster-${presetId}-${aspect.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('[poster] download failed', err);
      setDownloadError('Could not render the PNG. Try again, or switch browsers.');
    } finally {
      setIsDownloading(false);
    }
  }, [aspect.width, aspect.height, aspect.id, presetId]);

  if (demo === 'watermark') {
    return <WatermarkDemo showGrid={debugGrid} />;
  }

  return (
    <div className="app-shell">
      <Controls
        text={text}
        onTextChange={setText}
        presets={PRESETS}
        preset={presetId}
        onPresetChange={setPresetId}
        aspects={ASPECTS}
        aspect={aspectId}
        onAspectChange={setAspectId}
        onDownload={handleDownload}
        isDownloading={isDownloading}
        downloadError={downloadError}
      />
      <main className="preview" aria-label="Poster preview">
        <PosterStage
          text={text}
          preset={presetId}
          aspect={aspect}
          debugGrid={debugGrid}
          posterRef={posterRef}
        />
      </main>
    </div>
  );
}
