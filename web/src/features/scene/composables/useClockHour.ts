import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export type Clock = () => Date;

/** The player's local time as a fractional hour (e.g. 18.5 for 18:30), refreshed every `intervalMs`. */
export function useClockHour(clock: Clock = () => new Date(), intervalMs = 30_000): Ref<number> {
  const toHour = (d: Date): number => d.getHours() + d.getMinutes() / 60;
  const hour = ref(toHour(clock()));
  let timer: ReturnType<typeof setInterval> | undefined;
  onMounted(() => {
    timer = setInterval(() => (hour.value = toHour(clock())), intervalMs);
  });
  onBeforeUnmount(() => clearInterval(timer));
  return hour;
}
