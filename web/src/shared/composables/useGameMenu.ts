import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TranslationKey } from '../i18n';
import { useSession } from './useSession';

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
export function useGameMenu(initial: GameOverlay | null = null) {
  const router = useRouter();
  const overlay = ref<GameOverlay | null>(initial);

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
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
