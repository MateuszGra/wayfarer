// jsdom lacks ResizeObserver, which Reka UI components (e.g. the slider) use to measure themselves.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;
