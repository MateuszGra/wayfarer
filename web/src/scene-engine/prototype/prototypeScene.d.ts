export type WandererStatus = 'walking' | 'pitchingCamp' | 'sleeping' | 'packingUp' | 'resting';

export interface SceneSnapshot {
  readonly hour: number;
  readonly day: number;
  readonly km: number;
  readonly status: WandererStatus;
  readonly biome: string;
  readonly auto: boolean;
}

export interface SceneOptions {
  readonly hour?: number;
  readonly biome?: string;
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
  reseed(): void;
  destroy(): void;
}

export function startPrototypeScene(host: HTMLElement, options?: SceneOptions): Promise<Scene>;
