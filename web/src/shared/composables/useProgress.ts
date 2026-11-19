import { ref } from 'vue';

// Until steps are synchronised, the traveller's progress is fixed demo data shared by every screen
// (the scene engine starts its distance counter at the same value).
export const DEMO_DONE_KM = 214;

export function useProgress() {
  return { doneKm: ref(DEMO_DONE_KM) };
}
