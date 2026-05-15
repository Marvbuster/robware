import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship ResizeObserver — minimal stub so components that observe
// element size can mount in tests.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}
