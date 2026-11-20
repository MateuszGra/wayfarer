/** Height band of a mountain biome; biomes without levels always report `mid`. */
export type ElevationLevel = 'low' | 'mid' | 'high';

export type WandererStatus = 'walking' | 'pitchingCamp' | 'sleeping' | 'packingUp' | 'resting';

export type BehaviourId =
  | 'pipe'
  | 'grass'
  | 'view'
  | 'drink'
  | 'strap'
  | 'hat'
  | 'pebble'
  | 'catRide'
  | 'catDown'
  | 'catWash'
  | 'birdStarling'
  | 'birdRobin'
  | 'birdTit'
  | 'birdChaffinch'
  | 'birdSparrow'
  | 'shootingStar'
  | 'ship'
  | 'fishingBoat';

export type BehaviourGroup = 'wanderer' | 'cat' | 'bird' | 'world';

export interface SceneBehaviour {
  readonly id: BehaviourId;
  readonly group: BehaviourGroup;
}

export interface SceneSnapshot {
  readonly hour: number;
  readonly day: number;
  readonly km: number;
  readonly status: WandererStatus;
  readonly biome: string;
  readonly level: ElevationLevel;
  readonly auto: boolean;
  /** Behaviours that can be started at this moment, given the biome, the hour and what is happening. */
  readonly behaviours: readonly SceneBehaviour[];
}

export interface SceneOptions {
  readonly hour?: number;
  readonly biome?: string;
  readonly level?: ElevationLevel;
  readonly seed?: number;
  /** When true the scene's own clock runs; one in-game day lasts `dayLengthSeconds`. */
  readonly auto?: boolean;
  readonly dayLengthSeconds?: number;
  /** The landscape does not scroll: the traveller never walks (clouds, water and grass still move). */
  readonly still?: boolean;
  /** Starting value of the animation clock in seconds; lets a developer jump to a moment of a loop. */
  readonly animationTime?: number;
  /** Hides the wanderer, his camp and the starling, e.g. behind the sign-in screen. */
  readonly hideWanderer?: boolean;
  /** Beard length from 0 (clean-shaven) to 1 (full). */
  readonly beard?: number;
  /** Called about five times a second; never every frame. */
  readonly onSnapshot?: (snapshot: SceneSnapshot) => void;
}

export interface Scene {
  readonly biomeIds: readonly string[];
  setHour(hour: number): void;
  setAuto(on: boolean): void;
  setBeard(length: number): void;
  setDayLength(seconds: number): void;
  setBiome(id: string): void;
  /** The levels a biome offers: low, mid and high for mountain biomes, only mid for the rest. */
  levelsOf(id: string): readonly ElevationLevel[];
  setLevel(level: ElevationLevel): void;
  reseed(): void;
  /** Starts a behaviour now instead of waiting for its loop. */
  trigger(id: BehaviourId): void;
  destroy(): void;
}

export function startPrototypeScene(host: HTMLElement, options?: SceneOptions): Promise<Scene>;
