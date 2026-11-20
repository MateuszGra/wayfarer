import { describe, expect, it } from 'vitest';
import { trophyProgress, type TrophyInput } from './trophies';

const input = (totalSteps: number, current = 0, best = current): TrophyInput => ({
  totalSteps,
  streak: { current, best },
});
const progressOf = (id: string, totalSteps: number, current = 0, best = current) =>
  trophyProgress(input(totalSteps, current, best)).find((trophy) => trophy.id === id);

describe('trophyProgress', () => {
  it('lists every trophy from the closest to the furthest', () => {
    expect(trophyProgress(input(0)).map((trophy) => trophy.id)).toEqual([
      'aezakmi',
      'dragonborn',
      'tenOutOfTen',
      'kremowka',
      'postalVote',
      'ringBearer',
      'forrest',
      'twardowski',
    ]);
  });

  it('leaves a trophy unwon one step before its goal', () => {
    expect(progressOf('aezakmi', 19_999)).toEqual({
      id: 'aezakmi',
      measure: 'steps',
      goal: 20_000,
      done: 19_999,
      won: false,
    });
  });

  it('wins a trophy on exactly its goal', () => {
    expect(progressOf('aezakmi', 20_000)).toMatchObject({ done: 20_000, won: true });
  });

  it('counts no more than the goal once a trophy is won', () => {
    expect(progressOf('kremowka', 213_701)).toMatchObject({ goal: 213_700, done: 213_700, won: true });
  });

  it('wins nothing with no steps', () => {
    expect(trophyProgress(input(0)).filter((trophy) => trophy.won)).toEqual([]);
  });

  it('treats a negative total as no steps', () => {
    expect(progressOf('aezakmi', -5)).toMatchObject({ done: 0, won: false });
  });
});

describe('the ten-out-of-ten trophy', () => {
  it('counts the days in a row going on now', () => {
    expect(progressOf('tenOutOfTen', 0, 9)).toEqual({
      id: 'tenOutOfTen',
      measure: 'streak',
      goal: 10,
      done: 9,
      won: false,
    });
  });

  it('is won on the tenth day in a row', () => {
    expect(progressOf('tenOutOfTen', 0, 10)).toMatchObject({ done: 10, won: true });
  });

  it('stays won after the run is broken', () => {
    expect(progressOf('tenOutOfTen', 0, 0, 12)).toMatchObject({ done: 10, won: true });
  });

  it('starts again from the run going on now after a longer run was broken short of ten', () => {
    expect(progressOf('tenOutOfTen', 0, 2, 8)).toMatchObject({ done: 2, won: false });
  });
});
