import { describe, expect, it } from 'vitest';
import { trophyProgress, worldTrophyProgress, type TrophyInput } from './trophies';

const input = (totalSteps: number, current = 0, best = current, days = 0, bestDay = 0): TrophyInput => ({
  totalSteps,
  days,
  bestDay,
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
      'blaviken',
      'postalVote',
      'ringBearer',
      'forrest',
      'twardowski',
    ]);
  });

  it('leaves a trophy unwon one step before its goal', () => {
    expect(progressOf('dragonborn', 69_999)).toEqual({
      id: 'dragonborn',
      measure: 'steps',
      goal: 70_000,
      done: 69_999,
      won: false,
    });
  });

  it('wins a trophy on exactly its goal', () => {
    expect(progressOf('dragonborn', 70_000)).toMatchObject({ done: 70_000, won: true });
  });

  it('counts no more than the goal once a trophy is won', () => {
    expect(progressOf('kremowka', 213_701)).toMatchObject({ goal: 213_700, done: 213_700, won: true });
  });

  it('wins nothing with no steps', () => {
    expect(trophyProgress(input(0)).filter((trophy) => trophy.won)).toEqual([]);
  });

  it('treats a negative total as no steps', () => {
    expect(progressOf('dragonborn', -5)).toMatchObject({ done: 0, won: false });
  });
});

describe('the one-day trophy', () => {
  const withBestDay = (bestDay: number) =>
    trophyProgress(input(1_000_000, 0, 0, 0, bestDay)).find((trophy) => trophy.id === 'aezakmi');

  it('is not won by many days adding up, only by one big day', () => {
    expect(withBestDay(19_999)).toEqual({ id: 'aezakmi', measure: 'bestDay', goal: 20_000, done: 19_999, won: false });
  });

  it('is won by 20,000 steps in a single day', () => {
    expect(withBestDay(20_000)).toMatchObject({ done: 20_000, won: true });
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

describe('the full-beard trophy', () => {
  const onDay = (days: number) => trophyProgress(input(0, 0, 0, days)).find((trophy) => trophy.id === 'blaviken');

  it('counts the days on the road one short of a full beard', () => {
    expect(onDay(59)).toEqual({ id: 'blaviken', measure: 'days', goal: 60, done: 59, won: false });
  });

  it('is won on the day the beard is full', () => {
    expect(onDay(60)).toMatchObject({ done: 60, won: true });
  });
});

describe('worldTrophyProgress', () => {
  it('wins the trophy of a moment once it has been seen', () => {
    expect(worldTrophyProgress(['bigfootSeen'])).toEqual([
      { id: 'ropuchaSeen', measure: 'sighting', goal: 1, done: 0, won: false },
      { id: 'pikeCaught', measure: 'sighting', goal: 1, done: 0, won: false },
      { id: 'bigfootSeen', measure: 'sighting', goal: 1, done: 1, won: true },
      { id: 'lighthouseGlare', measure: 'sighting', goal: 1, done: 0, won: false },
      { id: 'hitchcock', measure: 'species', goal: 5, done: 0, won: false },
    ]);
  });

  it('counts the bird species that perched towards Hitchcock, one short of all five', () => {
    const hitchcock = worldTrophyProgress(['bird:starling', 'bird:robin', 'bird:tit', 'bird:chaffinch']).at(-1);

    expect(hitchcock).toMatchObject({ id: 'hitchcock', done: 4, won: false });
  });

  it('wins Hitchcock once all five bird species have perched', () => {
    const seen = ['bird:starling', 'bird:robin', 'bird:tit', 'bird:chaffinch', 'bird:sparrow'] as const;

    expect(worldTrophyProgress(seen).at(-1)).toMatchObject({ id: 'hitchcock', done: 5, won: true });
  });
});
