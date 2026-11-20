---
name: frontend-conventions
description: Frontend conventions for Wayfarer's game client (Vite + TypeScript + Vue 3 for the UI shell, PixiJS for the scene, MapLibre for the map, PWA): Atomic Design, the Wayfarer design system on Reka UI, components and architecture, the Vue ↔ PixiJS boundary, design tokens, Polish UI copy and error codes, accessibility, performance on phones, testing. Load when writing or changing anything under web/ or src/shared used by the game. Overrides the global fallback-frontend skill; visual details follow docs/style-guide.md.
---

Adapted from the general frontend guide to this project. The game has two worlds that must stay apart:

- **Vue:** the UI shell (screens, menus, journal, settings, sign-in, tracker connection).
- **PixiJS:** the scene, a canvas redrawn every frame.

The pure game logic in `src/shared` is shared with the backend.

## Structure

```
web/src/
  app/              bootstrap, router (History API, English paths: /scene, /map, /journal, /settings), PWA setup
  design-system/    the Wayfarer design system: tokens.css + Base* atoms (see "Design system")
  features/
    <feature>/      views/, components/{atoms,molecules,organisms}/, composables/, api/, types/
      scene/        SceneView + the Pixi scene (see below)
      map/          MapLibre route map
      journal/      postcards and milestones
      settings/     account, tracker connection, manual city for weather
      onboarding/   route choice, first steps
  shared/           feature-agnostic molecules/organisms, composables, api client, i18n, utils
  scene-engine/     PixiJS code, framework-free: sky, landscape, biomes, characters, camp, weather
```

- **Features are isolated:** a feature does not import another feature. Shared, feature-agnostic code goes in `shared/`.
- **One folder per component** (`ComponentName/ComponentName.vue`), with its tests next to it.

## Atomic Design (required)

The whole UI follows Atomic Design: atoms → molecules → organisms → views. Each layer imports only from the layers below it.

- **Atoms:**
  - the design system's `Base*` components in `web/src/design-system/`, such as `BaseButton`, `BasePanel`, `BaseIcon`, `BaseSlider`, `BaseToggle` and `BaseDialog`;
  - a feature's own atoms only when the design system really has nothing that fits.
- **Molecules:** one self-contained visual piece, such as `StatLine` (km and day), `NavItem` or `PostcardThumb`. Data comes in through props and user actions go out through events. No API calls and no store access.
- **Organisms:** larger blocks, such as `SceneHud`, `BottomNav`, `PostcardGrid` and `TrackerConnectForm`. They arrange molecules, wire composables and pass data down. A wrapper organism handles the phone and desktop layouts.
- **Views:** one per route, and thin. A view passes route params or store data to organisms, with no layout or business logic.
- **Plan first:** a new screen starts with a plan listing each component, its level, its responsibility, and its key props and emits. Build it bottom-up.

## The Vue ↔ PixiJS boundary

- `scene-engine/` has **no Vue imports**. It exposes a small typed API, for example:
  - `createScene(canvas, options)` returns `{ setState(state), resize(), destroy() }`.
  - `state` is a plain object: hour, walking or camping, offset on the route, biome segment, weather.
- `SceneView.vue` is the only place that touches the canvas.
  - It mounts the engine in `onMounted` and destroys it in `onBeforeUnmount`.
  - It passes state down through `setState`.
- **Scene objects are never reactive.** Never put Pixi objects, or anything that changes every frame, into `ref`, `reactive`, Pinia or props. Vue reacts to game state changes (a few times a minute), not to frames.
- The HUD (km, day, status) is Vue markup over the canvas. It updates from game state, throttled, not every frame.
- Biomes, the wanderer and the camp follow the project skills and docs: `wayfarer-biomes` and `docs/style-guide.md`.

## Vue components

- **Script setup:** always `<script setup lang="ts">`.
- **Props:** typed `defineProps<Props>()` with `withDefaults`; export `Props`.
- **Emits:** typed with `defineEmits<{ (event: 'select', id: string): void }>()`.
- **Name:** set with `defineOptions({ name })`.
- **Derived state:** use `computed` rather than watchers. Avoid deep watchers.
- **Lazy loading:** load heavy screens and libraries lazily. MapLibre is loaded only on `/map`; biome packs are loaded per route segment with dynamic `import()`.
- **Composables** (`use<Name>`) hold stateful logic, API calls, loading and error state.
- **API layer:** a typed API client lives in `shared/api/`. Composables call the API; the API never calls composables.
- **Planning:** before a new screen, write a short plan first: folder tree, components, composables, endpoints, mobile layout and build order.

## Design system

We use our own small **Wayfarer design system**, built on **Reka UI**: unstyled, accessible Vue primitives that handle focus, keyboard and ARIA. The look is ours.

- **Tokens:** colours, radii, spacing, type and shadows live as CSS custom properties in `web/src/design-system/tokens.css`, with values from `docs/style-guide.md`. Components use tokens only: no raw hex or px when a token exists, and no inline `style=`, except values computed at runtime such as a progress bar width.
- **One adapter per element:** each element is wrapped once in a `Base*` component, for example `BaseDialog` over Reka UI's Dialog and `BaseSlider` over its Slider. App code uses the `Base*` component; a raw Reka UI import appears only inside its adapter. When an adapter is missing, add it following the existing pattern.
- **Check the Reka UI API** (props, events, slots) in its docs or types, not from memory.
- **Variants** are a closed set of props, for example `variant: 'primary' | 'ghost'` and `size: 'sm' | 'md'`. Don't invent sizes or override a component's height from outside.
- **Custom CSS** outside the design system needs a reason. Anything reusable goes into the design system.
- **The look:** glass panels over the scene, light text with a soft shadow, pill buttons. Every overlay can be hidden so only the scene remains.

## UI copy and errors

- **Polish copy:** every player-facing string is in Polish and goes through `t(key, params?)`. Keys are English and namespaced (`scene.status.walking`). One sentence is one key. Don't invent copy; ask when unsure.
- **Everything else is English:** code, identifiers, comments and routes.
- **API errors:** handle them by `error.code`, mapped to keys in one table (`shared/api/errorMessages.ts`) with a generic fallback. Never show the API's `message` to players.

## Accessibility

- **The scene is decorative:** give the canvas an `aria-label` describing the scene. All information on it also exists in the HUD as text.
- **Real controls:** buttons and links, keyboard operable, with visible focus.
- **Reduced motion:** respect `prefers-reduced-motion` with slower drift, no flashes and no lighthouse dazzle.
- **Contrast:** HUD text stays readable over every time of day; check midday and night.

## Mobile, performance, PWA

- **Mobile first, and portrait first:** it is a phone game. Check about 400 px width and both orientations, with no horizontal scroll and safe-area insets respected.
- **Canvas resolution:** device pixel ratio capped at 2.
- **Battery:**
  - cap the scene at 30 fps when nothing moves fast,
  - pause rendering when the page is hidden,
  - rebuild layer geometry only after scrolling past its margin (see the style guide).
- **Offline:** route data and biome packs are cached by the service worker, so the scene works offline. Steps sync when the network returns.

## Contracts with the backend

- **One source of types:** request and response types live in `src/shared`, used by both the game and the API.
- **Changing an endpoint:** update the type, the backend route schema and the API client together, in one change.

## Testing (Vitest, Vue Test Utils, Playwright)

- **Game logic in `src/shared`** gets plain unit tests for steps → km, route position, time of day and the daily budget. Inject the clock; no real time.
- **Vue unit tests** (`Name.spec.ts`) test the component in isolation, with child components mocked. Assert visible behaviour: text, classes, emitted events after `trigger()`. Never assert `wrapper.vm`.
- **Vue integration tests** (`Name.integration.spec.ts`) use real children, store and router, with only the network mocked. Cover loading, error and empty states.
- **The scene engine** is not snapshot-tested pixel by pixel. Test its pure parts: the palette by hour, occlusion, the walk-cycle maths and biome data validation. Screenshot checks (headless Chrome) are for reviewing a visual change, not for CI.
- **E2E (Playwright)** covers onboarding, connecting a tracker (faked), the daily walk and the map. Select elements by `data-testid`.

## Refactoring

- **No behaviour change unless asked:** extract first, then simplify. Keep public props, emits and the engine API stable, and adjust tests right after each step.
- **The prototype bridge:** `scene-engine/prototype/prototypeScene.js` holds the whole scene in one file. It gets split into typed `scene-engine/` modules one at a time, not rewritten in one go.
