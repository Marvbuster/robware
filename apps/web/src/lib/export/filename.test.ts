import { describe, expect, it } from 'vitest';
import { EXPORT_FILENAME_PATTERN, exportFilename } from './filename';

describe('exportFilename', () => {
  const FROZEN = new Date(2026, 4, 15, 20, 31); // 2026-05-15 20:31 local

  it('formats as robware-{preset}-{ratio}-{yyyymmdd-hhmm}.png', () => {
    expect(exportFilename({ preset: 'editorial', ratio: '1x1', now: FROZEN })).toBe(
      'robware-editorial-1x1-20260515-2031.png',
    );
    expect(exportFilename({ preset: 'monolith', ratio: '4x5', now: FROZEN })).toBe(
      'robware-monolith-4x5-20260515-2031.png',
    );
    expect(exportFilename({ preset: 'salon', ratio: '9x16', now: FROZEN })).toBe(
      'robware-salon-9x16-20260515-2031.png',
    );
    expect(exportFilename({ preset: 'vapor', ratio: '1x1', now: FROZEN })).toBe(
      'robware-vapor-1x1-20260515-2031.png',
    );
  });

  it('zero-pads single-digit months, days, hours, and minutes', () => {
    expect(
      exportFilename({
        preset: 'editorial',
        ratio: '1x1',
        now: new Date(2026, 0, 2, 3, 4),
      }),
    ).toBe('robware-editorial-1x1-20260102-0304.png');
  });

  it('matches the published filename regex for every preset × ratio', () => {
    const presets = ['editorial', 'monolith', 'salon', 'vapor'] as const;
    const ratios = ['1x1', '4x5', '9x16'] as const;
    for (const preset of presets) {
      for (const ratio of ratios) {
        const name = exportFilename({ preset, ratio, now: FROZEN });
        expect(name, name).toMatch(EXPORT_FILENAME_PATTERN);
      }
    }
  });
});
