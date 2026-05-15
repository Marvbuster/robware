import type { PosterRatioId, PresetId } from '../../types';

export interface ExportFilenameInput {
  preset: PresetId;
  ratio: PosterRatioId;
  /** Defaults to `new Date()` at call time. Inject for deterministic tests. */
  now?: Date;
}

/**
 * Build the export filename per the ROB-11 schema:
 *   robware-{preset}-{ratio}-{yyyymmdd-hhmm}.png
 *
 * Local time on purpose — the timestamp is for the user, not for a server.
 */
export function exportFilename({ preset, ratio, now = new Date() }: ExportFilenameInput): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp =
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    '-' +
    pad(now.getHours()) +
    pad(now.getMinutes());
  return `robware-${preset}-${ratio}-${stamp}.png`;
}

export const EXPORT_FILENAME_PATTERN =
  /^robware-(editorial|monolith|salon|vapor)-(1x1|4x5|9x16)-\d{8}-\d{4}\.png$/;
