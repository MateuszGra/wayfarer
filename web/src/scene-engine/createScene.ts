import { Application, Graphics, Sprite, Texture } from 'pixi.js';
import { paletteAt, type Palette } from './palette';

export interface SceneState {
  readonly hour: number;
}

export interface Scene {
  setState(state: SceneState): void;
  destroy(): void;
}

const css = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

/**
 * First slice of the scene engine: sky gradient and sun for the current hour. The full scene from
 * prototypes/scene-demo is ported here module by module (landscape, biomes, wanderer, camp, weather).
 */
export async function createScene(host: HTMLElement, initial: SceneState): Promise<Scene> {
  const app = new Application();
  await app.init({
    resizeTo: host,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  host.appendChild(app.canvas);

  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2;
  skyCanvas.height = 256;
  const skyContext = skyCanvas.getContext('2d');
  const skyTexture = Texture.from(skyCanvas);
  const sky = new Sprite(skyTexture);
  const sun = new Graphics().circle(0, 0, 50).fill(0xffffff);
  app.stage.addChild(sky, sun);

  let state = initial;

  const paintSky = (p: Palette): void => {
    if (!skyContext) return;
    const g = skyContext.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, css(p.top));
    g.addColorStop(0.72, css(p.horizon));
    g.addColorStop(1, css(p.haze));
    skyContext.fillStyle = g;
    skyContext.fillRect(0, 0, 2, 256);
    skyTexture.source.update();
  };

  const render = (): void => {
    const { width: w, height: h } = app.screen;
    sky.width = w;
    sky.height = h;
    paintSky(paletteAt(state.hour));
    // Sun path from the style guide: rises about 05:36, sets about 20:24.
    const progress = (state.hour - 5.6) / (20.4 - 5.6);
    sun.visible = progress > 0 && progress < 1;
    sun.position.set(w * (0.08 + 0.84 * progress), h * 0.62 - Math.sin(progress * Math.PI) * h * 0.5);
    sun.scale.set((h * 0.026) / 50);
  };

  app.renderer.on('resize', render);
  render();

  return {
    setState(next) {
      state = next;
      render();
    },
    destroy() {
      app.destroy(true, { children: true, texture: true });
    },
  };
}
