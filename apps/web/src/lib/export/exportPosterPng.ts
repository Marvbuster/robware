import { domToBlob } from 'modern-screenshot';
import type { PosterRatioId, PresetId } from '../../types';
import { exportFilename } from './filename';
import { fontsReady } from './fontsReady';
import { prepareNodeForSnapshot } from './prepareNodeForSnapshot';
import { triggerDownload } from './triggerDownload';

export interface ExportPosterInput {
  /** The PosterFrame root node — must render at true export dimensions. */
  node: HTMLElement;
  preset: PresetId;
  ratio: PosterRatioId;
  /** Export pixel dimensions. Must match the on-screen frame size 1:1. */
  exportSize: { width: number; height: number };
  /** Inject for deterministic tests. */
  now?: Date;
}

export interface ExportPosterResult {
  filename: string;
  blob: Blob;
  pixelRatio: number;
  pixelDimensions: { width: number; height: number };
}

/**
 * Rasterise the poster frame to a PNG `Blob`, trigger a download, and return
 * the receipt. Library choice (modern-screenshot) is documented in ROB-11:
 * preserves text-wrap, hanging-punctuation, font-feature-settings, and
 * variable-font axes which the poster surface relies on.
 */
export async function exportPosterPng(input: ExportPosterInput): Promise<ExportPosterResult> {
  const { node, preset, ratio, exportSize, now } = input;

  await fontsReady();

  const restore = prepareNodeForSnapshot(node);
  let blob: Blob;
  try {
    const pixelRatio = computePixelRatio();
    const result = await domToBlob(node, {
      width: exportSize.width,
      height: exportSize.height,
      scale: pixelRatio,
      // PNG renders an opaque poster — the preset's `--paper` token paints the
      // background. Leaving backgroundColor unset lets the DOM paint own it,
      // which is what we want (no double-paint, no off-color edge).
      backgroundColor: undefined,
      type: 'image/png',
      quality: 1,
    });
    if (!(result instanceof Blob)) {
      throw new Error('modern-screenshot returned a non-Blob result');
    }
    blob = result;

    const filename = exportFilename({ preset, ratio, now });
    triggerDownload(blob, filename);

    return {
      filename,
      blob,
      pixelRatio,
      pixelDimensions: {
        width: exportSize.width * pixelRatio,
        height: exportSize.height * pixelRatio,
      },
    };
  } finally {
    restore();
  }
}

/**
 * `pixelRatio = max(2, devicePixelRatio)` so even a standard-DPR screen
 * produces a 2160×2160 minimum for the 1:1 frame.
 */
export function computePixelRatio(): number {
  if (typeof window === 'undefined') return 2;
  const dpr = window.devicePixelRatio;
  return Math.max(2, Number.isFinite(dpr) && dpr > 0 ? dpr : 2);
}

export class ExportError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ExportError';
  }
}
