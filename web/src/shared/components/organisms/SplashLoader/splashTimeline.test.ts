import { describe, expect, it } from 'vitest';
import { splashTimeline } from './splashTimeline';

describe('splashTimeline', () => {
  it('walks the first person out step by step at a calm pace', () => {
    expect(splashTimeline([4, 2, 2]).steps[0]).toEqual([300, 420, 540, 660]);
  });

  it('starts the second person only after the first has finished', () => {
    expect(splashTimeline([4, 3, 2]).steps[1]).toEqual([730, 840, 950]);
  });

  it('sends everyone else out together, quickly, a moment apart', () => {
    const { steps } = splashTimeline([4, 3, 2, 2]);

    expect(steps[2]).toEqual([1030, 1100]);
    expect(steps[3]).toEqual([1080, 1150]);
  });

  it('spreads the splash 0.15 s after the last footprint and is gone 0.5 s later', () => {
    const timeline = splashTimeline([4, 3, 2, 2]);

    expect(timeline.revealAt).toBe(1300);
    expect(timeline.doneAt).toBe(1800);
  });

  it('shows everything at once and only fades the black with reduced motion', () => {
    expect(splashTimeline([2, 1], true)).toEqual({ stainAt: 0, steps: [[0, 0], [0]], revealAt: 300, doneAt: 800 });
  });
});
