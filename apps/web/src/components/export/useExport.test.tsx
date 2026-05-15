import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Aspect } from '../../types';
import { useExport } from './useExport';

const SQUARE: Aspect = {
  id: 'square',
  ratio: '1x1',
  label: '1:1',
  hint: 'Square · feed',
  width: 1080,
  height: 1080,
};

function Harness({
  exportFn,
  toastDurationMs,
}: {
  exportFn: NonNullable<Parameters<typeof useExport>[0]['exportFn']>;
  toastDurationMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const ex = useExport({
    posterRef: ref,
    preset: 'editorial',
    aspect: SQUARE,
    exportFn,
    toastDurationMs,
  });
  return (
    <div>
      <div ref={ref} data-testid="poster">
        poster
      </div>
      <span data-testid="state">{ex.state.kind}</span>
      <span data-testid="filename">{ex.successFilename ?? ''}</span>
      <span data-testid="error">{ex.errorMessage ?? ''}</span>
      <button data-testid="dl" onClick={() => void ex.download()}>
        dl
      </button>
      <button data-testid="dismiss" onClick={() => ex.dismissToast()}>
        dismiss
      </button>
    </div>
  );
}

describe('useExport', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks idle → exporting → success → idle and surfaces the filename', async () => {
    vi.useFakeTimers();
    const exportFn = vi.fn().mockResolvedValue({
      filename: 'robware-editorial-1x1-20260515-2031.png',
      blob: new Blob(),
      pixelRatio: 2,
      pixelDimensions: { width: 2160, height: 2160 },
    });
    render(<Harness exportFn={exportFn} toastDurationMs={2400} />);
    expect(screen.getByTestId('state').textContent).toBe('idle');

    await act(async () => {
      screen.getByTestId('dl').click();
      // Flush the microtask queue so the resolved promise runs.
      await Promise.resolve();
    });
    expect(exportFn).toHaveBeenCalledOnce();
    expect(screen.getByTestId('state').textContent).toBe('success');
    expect(screen.getByTestId('filename').textContent).toBe(
      'robware-editorial-1x1-20260515-2031.png',
    );

    await act(async () => {
      vi.advanceTimersByTime(2400);
    });
    expect(screen.getByTestId('state').textContent).toBe('idle');
    expect(screen.getByTestId('filename').textContent).toBe('');
  });

  it('moves to error with the inline copy on failure', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const exportFn = vi.fn().mockRejectedValue(new Error('foreignObject blocked'));
    render(<Harness exportFn={exportFn} />);

    await act(async () => {
      screen.getByTestId('dl').click();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByTestId('state').textContent).toBe('error');
    expect(screen.getByTestId('error').textContent).toBe(
      "Couldn't export. Try a different preset or refresh.",
    );
    consoleSpy.mockRestore();
  });

  it('dismissToast clears a pending success and returns to idle', async () => {
    vi.useFakeTimers();
    const exportFn = vi.fn().mockResolvedValue({
      filename: 'robware-monolith-4x5-20260515-2031.png',
      blob: new Blob(),
      pixelRatio: 2,
      pixelDimensions: { width: 2160, height: 2700 },
    });
    render(<Harness exportFn={exportFn} toastDurationMs={2400} />);

    await act(async () => {
      screen.getByTestId('dl').click();
      await Promise.resolve();
    });
    expect(screen.getByTestId('state').textContent).toBe('success');

    act(() => {
      screen.getByTestId('dismiss').click();
    });
    expect(screen.getByTestId('state').textContent).toBe('idle');
  });
});
