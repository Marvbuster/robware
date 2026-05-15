interface DownloadButtonProps {
  onClick: () => void;
  isExporting: boolean;
  errorMessage: string | null;
}

/**
 * The Download button + inline error per ROB-11 §UX.
 *
 * - Label: "Download" (no icon in v0).
 * - Press: 120 ms scale-down to 0.98 — driven from `.download-button:active`,
 *   with the reduced-motion fallback handled globally in styles.css.
 * - Failure path: an inline error appears under the button. No toast on
 *   failure, no console-only error (the warn lives in `useExport`).
 */
export function DownloadButton({ onClick, isExporting, errorMessage }: DownloadButtonProps) {
  return (
    <>
      <button
        type="button"
        className="download-button"
        onClick={onClick}
        disabled={isExporting}
        aria-busy={isExporting || undefined}
      >
        {isExporting ? 'Rendering…' : 'Download'}
      </button>
      {errorMessage && (
        <p className="download-error" role="alert">
          {errorMessage}
        </p>
      )}
    </>
  );
}
