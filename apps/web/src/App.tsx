import { useRef, useState } from 'react';
import { Controls } from './components/Controls';
import { ExportToast } from './components/export/ExportToast';
import { useExport } from './components/export/useExport';
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
  const debugGrid = readDebugGrid();
  const demo = readDemo();

  const posterRef = useRef<HTMLDivElement | null>(null);
  const aspect = ASPECTS.find((a) => a.id === aspectId) ?? ASPECTS[0];

  const { download, isExporting, successFilename, errorMessage } = useExport({
    posterRef,
    preset: presetId,
    aspect,
  });

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
        onDownload={download}
        isDownloading={isExporting}
        downloadError={errorMessage}
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
      <ExportToast filename={successFilename} />
    </div>
  );
}
