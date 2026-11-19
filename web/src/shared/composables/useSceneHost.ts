import { onBeforeUnmount, onMounted, shallowRef, type Ref, type ShallowRef } from 'vue';
import { createScene, type Scene, type SceneOptions } from '@/scene-engine';

/**
 * Starts the scene engine inside `host` when the component mounts and destroys it on unmount.
 * The scene object itself is kept in a shallow ref: the engine redraws every frame outside Vue reactivity.
 */
export function useSceneHost(host: Ref<HTMLElement | null>, options: () => SceneOptions): ShallowRef<Scene | null> {
  const scene = shallowRef<Scene | null>(null);
  let unmounted = false;

  onMounted(async () => {
    if (!host.value) return;
    const created = await createScene(host.value, options());
    // The component may be gone while the scene is still starting; don't leak that Pixi application.
    if (unmounted) return created.destroy();
    scene.value = created;
  });
  onBeforeUnmount(() => {
    unmounted = true;
    scene.value?.destroy();
  });

  return scene;
}
