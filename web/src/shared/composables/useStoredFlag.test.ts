import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { useStoredFlag } from './useStoredFlag';

afterEach(() => localStorage.clear());

describe('useStoredFlag', () => {
  it('starts from the initial value when nothing is stored', () => {
    expect(useStoredFlag('test.flag', true).value).toBe(true);
  });

  it('remembers a change for the next visit', async () => {
    useStoredFlag('test.flag').value = true;
    await nextTick();

    expect(useStoredFlag('test.flag').value).toBe(true);
  });
});
