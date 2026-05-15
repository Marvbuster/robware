/**
 * Click an `<a download>` for `blob`, then revoke the object URL on the next
 * tick. Pure client-side — no third-party download service.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  // Some browsers require the element to be in the document for the download
  // gesture to be honoured (Safari historically). Attach + click + detach.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so the navigation/download has time to latch the URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
