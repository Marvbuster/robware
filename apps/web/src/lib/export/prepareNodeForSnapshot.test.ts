import { describe, expect, it } from 'vitest';
import {
  ExportPreconditionError,
  prepareNodeForSnapshot,
} from './prepareNodeForSnapshot';

function makeNode(setup?: (n: HTMLDivElement) => void): HTMLDivElement {
  const n = document.createElement('div');
  setup?.(n);
  document.body.appendChild(n);
  return n;
}

describe('prepareNodeForSnapshot', () => {
  it('sets text-rendering: geometricPrecision and restores the prior value', () => {
    const n = makeNode((node) => {
      node.style.textRendering = 'optimizeLegibility';
    });
    const restore = prepareNodeForSnapshot(n);
    expect(n.style.textRendering).toBe('geometricPrecision');
    restore();
    expect(n.style.textRendering).toBe('optimizeLegibility');
  });

  it('restores an unset textRendering back to empty', () => {
    const n = makeNode();
    const restore = prepareNodeForSnapshot(n);
    expect(n.style.textRendering).toBe('geometricPrecision');
    restore();
    expect(n.style.textRendering).toBe('');
  });

  it('throws ExportPreconditionError when a descendant has a filter', () => {
    const n = makeNode((node) => {
      const child = document.createElement('span');
      child.style.filter = 'blur(4px)';
      node.appendChild(child);
    });
    expect(() => prepareNodeForSnapshot(n)).toThrow(ExportPreconditionError);
  });

  it('throws ExportPreconditionError when a descendant has mix-blend-mode', () => {
    const n = makeNode((node) => {
      const child = document.createElement('span');
      child.style.mixBlendMode = 'multiply';
      node.appendChild(child);
    });
    expect(() => prepareNodeForSnapshot(n)).toThrow(ExportPreconditionError);
  });

  it('accepts clean subtrees', () => {
    const n = makeNode((node) => {
      node.innerHTML = '<h1>Headline</h1><span class="poster-frame__watermark">robware</span>';
    });
    expect(() => prepareNodeForSnapshot(n)).not.toThrow();
  });
});
