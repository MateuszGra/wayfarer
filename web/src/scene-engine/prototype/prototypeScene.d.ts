import type { SightingId } from '@shared/achievements/worldEvents';
import type { Weather } from '@shared/weather/weather';

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
  | 'fishingBoat'
  | 'angler'
  | 'bigfoot'
  | 'sailboat'
  | 'swans';

export type BehaviourGroup = 'wanderer' | 'cat' | 'bird' | 'world';

export interface SceneBehaviour {
  readonly id: BehaviourId;
  readonly group: BehaviourGroup;
}

export type CampHabit = 'both' | 'pipe' | 'tea';

export interface SceneWorldEvent {
  readonly id: SightingId;
  readonly forced: boolean;
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

/** Today's walk in local hours; `leadHours` of getting up and packing come before `startHour`. */
export interface SceneWalk {
  readonly startHour: number;
  readonly endHour: number;
  readonly leadHours?: number;
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
  readonly campHabit?: CampHabit;
  /** The weather layers to draw; left out, a clear sky with a light breeze. */
  readonly weather?: Weather;
  /** Today's walk, or null for a day at camp; left out, the prototype's demo day (07:12–19:18). */
  readonly walk?: SceneWalk | null;
  /** Called about five times a second; never every frame. */
  readonly onSnapshot?: (snapshot: SceneSnapshot) => void;
  /** Something rare happened in view; `forced` when the developer panel started it. */
  readonly onWorldEvent?: (event: SceneWorldEvent) => void;
}

export interface Scene {
  readonly biomeIds: readonly string[];
  setHour(hour: number): void;
  setAuto(on: boolean): void;
  setBeard(length: number): void;
  setDayLength(seconds: number): void;
  /** Today's walk, or null for a day at camp. */
  setWalk(walk: SceneWalk | null): void;
  setWeather(weather: Weather): void;
  /** What he does by the fire: takes turns with his pipe and a mug of tea, or keeps to one. */
  setCampHabit(habit: CampHabit): void;
  setBiome(id: string): void;
  /** The levels a biome offers: low, mid and high for mountain biomes, only mid for the rest. */
  levelsOf(id: string): readonly ElevationLevel[];
  setLevel(level: ElevationLevel): void;
  reseed(): void;
  /** Shows the landscape of a place on the route: biome, level and variant at once. */
  setLandscape(landscape: { readonly biome: string; readonly level: ElevationLevel; readonly seed: number }): void;
  /** Starts a behaviour now instead of waiting for its loop. */
  trigger(id: BehaviourId): void;
  destroy(): void;
}

export function startPrototypeScene(host: HTMLElement, options?: SceneOptions): Promise<Scene>;
