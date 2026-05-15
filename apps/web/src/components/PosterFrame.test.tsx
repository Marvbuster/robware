import { render } from '@testing-library/react';
import { PosterFrame } from './PosterFrame';
import { POSTER_FRAME_DIMENSIONS, type PosterRatio } from './posterFrame.fit';
import type { PresetId } from '../types';

const ALL_RATIOS: PosterRatio[] = ['1x1', '4x5', '9x16'];
const ALL_PRESETS: PresetId[] = ['editorial', 'monolith', 'salon', 'vapor'];

describe('PosterFrame', () => {
  it('renders the headline at the requested ratio and preset', () => {
    const { container } = render(<PosterFrame ratio="1x1" preset="editorial" text="Set it." />);
    const frame = container.querySelector<HTMLElement>('.poster-frame');
    expect(frame).not.toBeNull();
    expect(frame).toHaveAttribute('data-ratio', '1x1');
    expect(frame).toHaveAttribute('data-preset', 'editorial');
    const headline = frame!.querySelector<HTMLElement>(
      '.poster-frame__headline:not(.poster-frame__headline--measure)',
    );
    expect(headline?.textContent).toBe('Set it.');
  });

  it('exposes the export dimensions on the frame element', () => {
    for (const ratio of ALL_RATIOS) {
      const spec = POSTER_FRAME_DIMENSIONS[ratio];
      const { container, unmount } = render(
        <PosterFrame ratio={ratio} preset="editorial" text="Anything" />,
      );
      const frame = container.querySelector<HTMLElement>('.poster-frame');
      expect(frame?.style.width).toBe(`${spec.width}px`);
      expect(frame?.style.height).toBe(`${spec.height}px`);
      unmount();
    }
  });

  it('renders a watermark slot regardless of ratio', () => {
    for (const ratio of ALL_RATIOS) {
      const { container, unmount } = render(
        <PosterFrame ratio={ratio} preset="editorial" text="Hi" />,
      );
      const mark = container.querySelector('.poster-frame__watermark');
      expect(mark?.textContent).toBe('robware');
      unmount();
    }
  });

  it('mounts cleanly for every preset × ratio combination', () => {
    for (const ratio of ALL_RATIOS) {
      for (const preset of ALL_PRESETS) {
        const { container, unmount } = render(
          <PosterFrame ratio={ratio} preset={preset} text="Twelve cases on parade" />,
        );
        const frame = container.querySelector<HTMLElement>('.poster-frame');
        expect(frame).toHaveAttribute('data-ratio', ratio);
        expect(frame).toHaveAttribute('data-preset', preset);
        unmount();
      }
    }
  });

  it('does not paint the debug overlay by default', () => {
    const { container } = render(<PosterFrame ratio="4x5" preset="vapor" text="Plain" />);
    expect(container.querySelector('.poster-frame__debug')).toBeNull();
  });

  it('paints the debug overlay when debugGrid is set', () => {
    const { container } = render(
      <PosterFrame ratio="9x16" preset="monolith" text="Grid me" debugGrid />,
    );
    expect(container.querySelector('.poster-frame__debug')).not.toBeNull();
    expect(container.querySelector('.poster-frame__debug-safe')).not.toBeNull();
    expect(container.querySelector('.poster-frame__debug-band--headline')).not.toBeNull();
    expect(container.querySelector('.poster-frame__debug-band--watermark')).not.toBeNull();
  });

  it('uses 5.5% of the shortest edge for the safe margin', () => {
    const { container } = render(<PosterFrame ratio="9x16" preset="editorial" text="Margins" />);
    const frame = container.querySelector<HTMLElement>('.poster-frame');
    // shortest edge = 1080 → 5.5% = 59.4 → rounded to 59
    expect(frame?.style.getPropertyValue('--pframe-safe-margin')).toBe('59px');
  });

  it('forwards the frame ref to the root element', () => {
    let captured: HTMLDivElement | null = null;
    render(
      <PosterFrame
        ratio="1x1"
        preset="salon"
        text="Ref forward"
        ref={(node) => {
          captured = node;
        }}
      />,
    );
    expect(captured).not.toBeNull();
    expect(captured!.classList.contains('poster-frame')).toBe(true);
  });
});
