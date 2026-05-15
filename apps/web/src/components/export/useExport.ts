import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { exportPosterPng, type ExportPosterResult } from '../../lib/export';
import type { Aspect, PresetId } from '../../types';

const ERROR_COPY = "Couldn't export. Try a different preset or refresh.";
const TOAST_DURATION_MS = 2400;

export interface UseExportArgs {
  /** Ref to the poster frame root node — what gets snapshotted. */
  posterRef: RefObject<HTMLElement | null>;
  preset: PresetId;
  aspect: Aspect;
  /** Override `exportPosterPng` (testing). */
  exportFn?: typeof exportPosterPng;
  /** Override toast auto-dismiss timer (testing). */
  toastDurationMs?: number;
}

export type ExportState =
  | { kind: 'idle' }
  | { kind: 'exporting' }
  | { kind: 'success'; filename: string }
  | { kind: 'error'; message: string };

export interface UseExportReturn {
  state: ExportState;
  isExporting: boolean;
  successFilename: string | null;
  errorMessage: string | null;
  download: () => Promise<void>;
  dismissToast: () => void;
}

export function useExport({
  posterRef,
  preset,
  aspect,
  exportFn = exportPosterPng,
  toastDurationMs = TOAST_DURATION_MS,
}: UseExportArgs): UseExportReturn {
  const [state, setState] = useState<ExportState>({ kind: 'idle' });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToastTimer = useCallback(() => {
    if (toastTimer.current !== null) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  }, []);

  useEffect(() => clearToastTimer, [clearToastTimer]);

  const download = useCallback(async () => {
    const node = posterRef.current;
    if (!node) return;
    clearToastTimer();
    setState({ kind: 'exporting' });
    let result: ExportPosterResult;
    try {
      result = await exportFn({
        node: node as HTMLElement,
        preset,
        ratio: aspect.ratio,
        exportSize: { width: aspect.width, height: aspect.height },
      });
    } catch (err) {
      // Forensic log only — UI error copy is plain language per the spec.
      console.warn('[export] failed', err);
      setState({ kind: 'error', message: ERROR_COPY });
      return;
    }
    setState({ kind: 'success', filename: result.filename });
    toastTimer.current = setTimeout(() => {
      setState({ kind: 'idle' });
      toastTimer.current = null;
    }, toastDurationMs);
  }, [aspect.height, aspect.ratio, aspect.width, clearToastTimer, exportFn, posterRef, preset, toastDurationMs]);

  const dismissToast = useCallback(() => {
    clearToastTimer();
    setState({ kind: 'idle' });
  }, [clearToastTimer]);

  return {
    state,
    isExporting: state.kind === 'exporting',
    successFilename: state.kind === 'success' ? state.filename : null,
    errorMessage: state.kind === 'error' ? state.message : null,
    download,
    dismissToast,
  };
}
