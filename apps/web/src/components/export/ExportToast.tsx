interface ExportToastProps {
  filename: string | null;
}

/**
 * Optimistic success toast per ROB-11 §UX.
 *
 * - Slides in from the bottom in 180 ms via `--ease-standard` (CSS).
 * - Auto-dismisses at 2400 ms — controlled by `useExport`'s timer, this
 *   component just renders when `filename` is non-null.
 * - `prefers-reduced-motion: reduce` collapses slide+scale to a 120 ms opacity
 *   fade (handled by the global reduced-motion block in styles.css).
 * - The filename is the receipt — no "Download complete!" copy.
 */
export function ExportToast({ filename }: ExportToastProps) {
  return (
    <div
      className="export-toast"
      role="status"
      aria-live="polite"
      data-visible={filename ? 'true' : undefined}
    >
      {filename && <span className="export-toast__filename">{filename}</span>}
    </div>
  );
}
