/**
 * Apply export-only rendering hints to `node` and return a `restore()` thunk.
 *
 * - `text-rendering: geometricPrecision` produces the crispest glyph edges in
 *   `foreignObject` rasterisation. It is too expensive for live editing but
 *   exactly right for a one-shot snapshot.
 * - The poster surface is already constrained by the design bar to avoid
 *   `filter` and `mix-blend-mode`. We assert that here so a future regression
 *   surfaces as an export error rather than a silently desaturated PNG.
 */
export function prepareNodeForSnapshot(node: HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {};

  assertNoBlockedEffects(node);

  const previous = node.style.textRendering;
  node.style.textRendering = 'geometricPrecision';

  return () => {
    node.style.textRendering = previous;
  };
}

function assertNoBlockedEffects(root: HTMLElement): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let current: Node | null = walker.currentNode;
  while (current) {
    if (current instanceof HTMLElement) {
      const cs = getComputedStyle(current);
      if (hasValue(cs.filter, 'none')) {
        throw new ExportPreconditionError(
          `Unexpected CSS filter on .${current.className || current.tagName.toLowerCase()}. ` +
            'The poster surface forbids filter/blend modes — they desaturate the PNG.',
        );
      }
      if (hasValue(cs.mixBlendMode, 'normal')) {
        throw new ExportPreconditionError(
          `Unexpected mix-blend-mode on .${current.className || current.tagName.toLowerCase()}.`,
        );
      }
    }
    current = walker.nextNode();
  }
}

/**
 * Treat an empty string or the default keyword as "no value" — JSDOM returns
 * `""` for properties without an inline value, while real browsers return the
 * default keyword (`"none"`, `"normal"`). Anything else is a real value we care
 * about.
 */
function hasValue(value: string | null | undefined, defaultKeyword: string): boolean {
  if (value === null || value === undefined) return false;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === defaultKeyword) return false;
  return true;
}

export class ExportPreconditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportPreconditionError';
  }
}
