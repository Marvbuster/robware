import { render, screen } from '@testing-library/react';
import { Watermark } from './Watermark';

describe('Watermark', () => {
  it('renders the literal lowercase wordmark', () => {
    render(<Watermark />);
    const el = screen.getByLabelText('robware');
    expect(el).toHaveTextContent('robware');
    expect(el.textContent).toBe('robware');
  });

  it('uses true small caps via OpenType features, not text-transform', () => {
    render(<Watermark />);
    const el = screen.getByLabelText('robware');
    const styles = el.getAttribute('style') ?? '';
    expect(styles).toMatch(/font-feature-settings:\s*"smcp",\s*"c2sc"/);
    expect(styles).not.toMatch(/text-transform:\s*uppercase/);
  });

  it('scales font size from frame shortest edge (1.4%)', () => {
    render(<Watermark />);
    const el = screen.getByLabelText('robware');
    expect(el.getAttribute('style')).toMatch(/font-size:\s*calc\(min\(var\(--frame-w[^)]*\),\s*var\(--frame-h[^)]*\)\)\s*\*\s*0\.014\)/);
  });

  it('inherits color from --mute and font from --display-face', () => {
    render(<Watermark />);
    const el = screen.getByLabelText('robware');
    const styles = el.getAttribute('style') ?? '';
    expect(styles).toMatch(/color:\s*var\(--mute/);
    expect(styles).toMatch(/font-family:\s*var\(--display-face/);
  });

  it('pins to bottom-right of safe-margin grid', () => {
    render(<Watermark />);
    const el = screen.getByLabelText('robware');
    const styles = el.getAttribute('style') ?? '';
    expect(styles).toMatch(/position:\s*absolute/);
    expect(styles).toMatch(/bottom:\s*var\(--safe-margin/);
    expect(styles).toMatch(/right:\s*var\(--safe-margin/);
  });

  it('applies optical overhang correction via negative margin-right', () => {
    render(<Watermark />);
    const el = screen.getByLabelText('robware');
    expect(el.getAttribute('style')).toMatch(/margin-right:\s*calc\(var\(--watermark-overhang[^)]*\)\s*\*\s*-1\)/);
  });

  it('exposes no prop to hide the watermark (v0)', () => {
    // Type-level enforcement: only className/style are accepted.
    // If someone adds a `hidden`/`show` prop, this test will need to change
    // alongside the spec — that's the point.
    render(<Watermark />);
    expect(screen.getByLabelText('robware')).toBeVisible();
  });
});
