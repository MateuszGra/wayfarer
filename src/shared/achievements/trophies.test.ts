import { describe, expect, it } from 'vitest';
import { trophyProgress } from './trophies';

const progressOf = (totalSteps: number, id: string) => trophyProgress(totalSteps).find((trophy) => trophy.id === id);

describe('trophyProgress', () => {
  it('lists every trophy from the closest to the furthest', () => {
    expect(trophyProgress(0).map((trophy) => trophy.id)).toEqual([
      'aezakmi',
      'dragonborn',
      'postalVote',
      'kremowka',
      'ringBearer',
      'forrest',
      'twardowski',
    ]);
  });

  it('leaves a trophy unwon one step before its goal', () => {
    expect(progressOf(19_999, 'aezakmi')).toEqual({ id: 'aezakmi', goal: 20_000, done: 19_999, won: false });
  });

  it('wins a trophy on exactly its goal', () => {
    expect(progressOf(20_000, 'aezakmi')).toEqual({ id: 'aezakmi', goal: 20_000, done: 20_000, won: true });
  });

  it('counts no more than the goal once a trophy is won', () => {
    expect(progressOf(213_701, 'kremowka')).toEqual({ id: 'kremowka', goal: 213_700, done: 213_700, won: true });
  });

  it('wins nothing with no steps', () => {
    expect(trophyProgress(0).filter((trophy) => trophy.won)).toEqual([]);
  });

  it('treats a negative total as no steps', () => {
    expect(progressOf(-5, 'aezakmi')).toEqual({ id: 'aezakmi', goal: 20_000, done: 0, won: false });
  });
});
