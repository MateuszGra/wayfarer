// Public API of the framework-free scene engine. Only SceneView.vue uses it.
export { startPrototypeScene as createScene } from './prototype/prototypeScene.js';
export type {
  BehaviourGroup,
  BehaviourId,
  ElevationLevel,
  Scene,
  SceneBehaviour,
  SceneOptions,
  SceneSnapshot,
  SceneWalk,
  SceneWorldEvent,
  WandererStatus,
} from './prototype/prototypeScene.js';
export { paletteAt, type Palette } from './palette';
