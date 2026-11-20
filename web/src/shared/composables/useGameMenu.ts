import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { TranslationKey } from '../i18n';
import { useSession } from './useSession';
import { useSplash } from './useSplash';

/** Windows that open over the game. Only one is open at a time. */
export type GameOverlay = 'menu' | 'map' | 'achievements' | 'settings';

export interface MenuEntry {
  readonly id: Exclude<GameOverlay, 'menu'>;
  readonly label: TranslationKey;
}

// Sign-out is not an entry: the menu always renders it last, after these.
export const MENU_ENTRIES: readonly MenuEntry[] = [
  { id: 'map', label: 'menu.map' },
  { id: 'achievements', label: 'menu.achievements' },
  { id: 'settings', label: 'menu.settings' },
];

/**
 * The game's menu and the windows it opens. Escape closes whatever is open, or opens the menu when nothing is.
 * The key is handled in the capture phase on window and stopped there, so a dialog's own Escape handling
 * can't close it and let this listener reopen it straight away.
 */
// A window to reopen when the player comes back to the game, e.g. the settings after leaving them for the
// journey planner. Used once.
let reopenOnReturn: GameOverlay | null = null;
export function returnToOverlay(overlay: GameOverlay): void {
  reopenOnReturn = overlay;
}

export function useGameMenu(start: GameOverlay | null = null, locked: () => boolean = () => false) {
  const initial = reopenOnReturn ?? start;
  reopenOnReturn = null;
  const router = useRouter();
  const splash = useSplash();
  // A window asked for at start opens only once the splash screen is over, not through its holes.
  const overlay = ref<GameOverlay | null>(splash.playing.value ? null : initial);
  if (splash.playing.value && initial) {
    const stop = watch(splash.playing, (playing) => {
      if (playing) return;
      overlay.value = initial;
      stop();
    });
  }

  const onKeydown = (event: KeyboardEvent): void => {
    // While the splash plays, or a window that must be answered first is up, Escape does nothing.
    if (event.key !== 'Escape' || splash.playing.value || locked()) return;
    event.stopPropagation();
    overlay.value = overlay.value ? null : 'menu';
  };
  onMounted(() => window.addEventListener('keydown', onKeydown, { capture: true }));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown, { capture: true }));

  const show = (which: GameOverlay) => (open: boolean) => {
    overlay.value = open ? which : null;
  };
  const select = (id: MenuEntry['id']): void => {
    overlay.value = id;
  };
  const back = (): void => {
    overlay.value = 'menu';
  };
  const session = useSession();
  // Back to the sign-in screen even if the server couldn't be told: the local session is gone either way.
  const logout = async (): Promise<void> => {
    overlay.value = null;
    await session.signOut().catch(() => {});
    await router.push('/login');
  };

  return { overlay, entries: MENU_ENTRIES, show, select, back, logout };
}
