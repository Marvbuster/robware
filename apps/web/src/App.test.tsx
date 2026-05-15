import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { DEFAULT_TEXT, PRESETS } from './presets';

function getPoster(): HTMLElement {
  const main = screen.getByRole('main', { name: /poster preview/i });
  const poster = main.querySelector<HTMLElement>('.poster-frame');
  if (!poster) throw new Error('PosterFrame element not found');
  return poster;
}

function getHeadlineText(poster: HTMLElement): string {
  const headline = poster.querySelector<HTMLElement>(
    '.poster-frame__headline:not(.poster-frame__headline--measure)',
  );
  if (!headline) throw new Error('PosterFrame headline not found');
  return headline.textContent ?? '';
}

describe('App', () => {
  it('renders the controls header and default text in the poster', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /type a sentence/i })).toBeInTheDocument();
    expect(getHeadlineText(getPoster())).toBe(DEFAULT_TEXT);
  });

  it('updates the poster when text changes', () => {
    render(<App />);
    const textarea = screen.getByLabelText(/your text/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Hello robware' } });
    expect(getHeadlineText(getPoster())).toBe('Hello robware');
  });

  it('switches preset when a style is selected', () => {
    render(<App />);
    const monolith = screen.getByRole('radio', { name: /monolith/i });
    fireEvent.click(monolith);
    expect(monolith).toHaveAttribute('aria-checked', 'true');
    expect(getPoster()).toHaveAttribute('data-preset', 'monolith');
  });

  it('exposes a radio per preset and per aspect', () => {
    render(<App />);
    for (const preset of PRESETS) {
      expect(screen.getByRole('radio', { name: new RegExp(preset.name, 'i') })).toBeInTheDocument();
    }
    expect(screen.getByRole('radio', { name: /1:1/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /4:5/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /9:16/i })).toBeInTheDocument();
  });

  it('changes ratio when a format is selected', () => {
    render(<App />);
    const story = screen.getByRole('radio', { name: /9:16/i });
    fireEvent.click(story);
    expect(getPoster()).toHaveAttribute('data-ratio', '9x16');
  });
});
