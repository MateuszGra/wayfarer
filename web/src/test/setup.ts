// jsdom lacks ResizeObserver, which Reka UI components (e.g. the slider) use to measure themselves.
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

// The splash screen plays once per page load; tests start as if it had already played, and the ones
// about it turn it back on.
import { beforeEach } from 'vitest';
import { setSplashPlayingForTests } from '@/shared/composables/useSplash';
beforeEach(() => setSplashPlayingForTests(false));
