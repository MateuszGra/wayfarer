# Wayfarer — Visual Style Guide

The single source of truth for how the game looks and moves. Every new scene, biome, character variant or prop must follow it, so the game always looks like one world.

Reference implementation: `prototypes/scene-demo/index.html` (PixiJS, everything drawn from code, no bitmap art).

## 1. Principles

- **The scene is a living painting.** A fixed, composed side view. No free camera, no player-controlled movement. The landscape is the main content; the UI is minimal and can be hidden.
- **Flat shapes, light does the work.** Clean vector silhouettes with no outlines. Mood comes from colour, atmospheric depth, fog and light, not from texture detail.
- **Cozy and slow.** Nothing rushes. Animations are gentle, loops are long, transitions fade.
- **Believable, not exact.** Biomes are an impression of the real region (mountains look like those mountains, forests like those forests), never a reproduction of a specific real view.
- **Original.** No characters, symbols or signature looks from existing works (see section 10).

## 2. Rendering conventions

- Everything is generated in code with PixiJS `Graphics` and a few procedural textures (radial glow, soft blob, vertical gradient, ray). No image files.
- Shapes are drawn in white and coloured with `tint`, so the time-of-day palette can recolour the whole scene every frame without redrawing geometry.
- Layer geometry is drawn once over a strip wider than the screen and slid sideways; it is re-tessellated only after scrolling past the margin.
- All sizes are relative to screen height `H`:
  - landscape: fractions of `H` (`base`, `amp`, `wave`),
  - characters and camp props: units of `H / 850` (the wanderer is about 110 units tall).
- Deterministic variety: every random choice comes from a seeded hash, so the same seed always produces the same scene. A "new variant" means a new seed.
- A film-grain overlay (about 7 % opacity, `overlay` blend) and a soft vignette sit on top of the whole scene to hide gradient banding and give a printed feel.

## 3. Time of day

The palette is keyframed by hour and interpolated with smoothstep. Each keyframe defines `top` (zenith), `hor` (horizon), `haze` (atmospheric colour), `light` (sunlight tint), `cloud`, `bright` (overall light level) and `stars` (0–1).

| Hour       | Moment         | Character of the light                                    |
| ---------- | -------------- | --------------------------------------------------------- |
| 0:00–4:36  | Night          | Deep navy sky, stars, cool moonlight, `bright` about 0.24 |
| 5:30       | Dawn           | Violet sky, dusty pink horizon, stars fading              |
| 6:24       | Sunrise        | Warm orange horizon, peach light                          |
| 8:30–13:00 | Day            | Clear blue, white light, `bright` about 1.0               |
| 17:12      | Late afternoon | Golden horizon, warm light                                |
| 19:06      | Sunset         | Coral horizon, orange light, alpenglow on peaks           |
| 20:12      | Dusk           | Purple horizon, first stars                               |
| 21:24      | Night          | Back to navy                                              |

Rules:

- Sun path: rises about 5:36, sets about 20:24, arc across the sky. Moon: about 19:48 to 6:48.
- **Occlusion:** a sun or moon hidden behind the terrain lights nothing. Lake reflection, ridge rim light, sun rays, the sun veil and most of the lit/shaded contrast fade out over about one disc diameter as it sinks behind a peak.
- Morning mist peaks around 6:00–7:30 and clears by 10:00.

## 4. Landscape

### Layers (back to front)

1. Sky gradient, Milky Way band, stars, shooting stars.
2. Moon and sun (disc, glow, halo), clouds, birds.
3. Far ridges, drawn behind everything else on the ground.
4. Optional lake with the sky and far ridges mirrored.
5. Mid hills with forests, cabins and villages.
6. Near hill with large trees.
7. Ground with the path, grass and flowers.
8. Camp, wanderer, bird, fire and particles.
9. Corner framing silhouettes (landscape orientation only; hidden on portrait phones).

### Colour of a layer

- `colour = mix(base × light × bright, haze, depth^1.5 × 0.85 + 0.03)` where `depth` is 1 for the farthest layer and about 0 for the ground. Far layers melt into the haze; near layers keep their own colour.
- Fog sprites sit at the foot of each layer. Their strength scales with depth, so mist stays in the distance and near layers keep their colour.

### Shading by light direction

- Mountains have two faces per peak, split by a crease running from the summit. Each tree, cabin and roof is split into a left and a right half.
- The side facing the sun or moon is lifted toward the light colour; the far side is darkened **multiplicatively** with a cool tone (`mix(0x6670a8, haze, 0.3)`). Never mix toward a fixed colour; that turns dark near trees grey.
- Contrast is strongest at low sun and minimal at night.
- Rock gullies are thin strokes inside the mountain faces. Snow follows the same faces and is bluish on the shaded side and pink-orange at sunset.

### Lake

The mirrored sky, mirrored far ridges at 85 % opacity, a light sheen under the shoreline, a thin bright shore line, shimmer dashes, and a soft vertical streak below the sun or moon (only while the source is visible).

### Clouds

Flat-bottomed cumulus built from overlapping circles in three tones: shaded underside, body and a lit top. No straight streaks.

## 5. Biomes

A biome is data: a list of layers with `base`, `amp`, `wave`, `oct`, `speed` (parallax factor), `color`, plus optional `snow`, `faces`, `trees`, `cabins`, `village`, `rows`, `path`, `grass`, `flowers`, a lake level and mist positions.

| Biome                      | Far                                                        | Middle                                                                                                                                   | Near and ground                                | Accents                                                    |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| Baltic coast (route start) | Open sea to a clean flat horizon. No islands, no headlands | Wide pale beach with wet sand, surf foam, wooden groynes and fishing boats; behind it a green coastal belt with pines and one lighthouse | Big coastal pines on grassy ground, sandy path | White gulls; the lighthouse beam at night                  |
| Mountains and lake         | Sharp snowy ridges with faces and gullies                  | Lake, pine hills, wooden cabins                                                                                                          | Tall pines, rocky angular path                 | Alpine flowers (white, yellow, violet)                     |
| Beech forest               | Soft blue ridge                                            | Layered round-crowned forests, cabins                                                                                                    | Big beeches, forest floor                      | White and yellow flowers, strong morning mist and sun rays |
| Meseta                     | Low flat ridge                                             | Stone village with church tower, fields with furrows in patches                                                                          | Golden grass, dusty path                       | Red poppies                                                |

Buildings:

- Cabins (mountains, forest): wooden walls `#8A5C3A` with plank lines and dark roofs `#4E3526`, plus a chimney.
- Coastal pines: conifers shaped like a loose spruce. The lower third of the trunk is bare, the tiers are uneven and set high, and the tree leans slightly. They grow only on green ground, never on the beach or bare sand.
- Lighthouse: a tapered red tower `#B04A3A` with two white bands, a gallery and a lamp room. It stands on the green belt and is clearly taller than the trees around it.
  - There is one per long stretch of coast, never two side by side.
  - At night the lamp turns full circle. Side-on, the beam swings left and right. It is a cone: narrow at the lamp, widening outward, then running almost parallel and fading with distance. When it turns toward the viewer it shrinks to a point and the lamp flares, briefly dazzling the scene.
- Meseta village: light stone `#D1BC95` with terracotta roofs `#A9573A`.
- Windows are dark by day and glow warm `#FFC46B` at night.

## 6. The wanderer

A lanky, bearded, slightly mysterious wanderer. Upright and young in posture, never stooped.

### Silhouette and outfit

- **Body:** tall and slim, long legs. Thigh 27 units, shin 26 units, hip height 55 units, close to the full reach of the leg (56). The knees only soften and never crouch.
- **Cape:** long, dark, down to mid-shin, with an upturned collar. No lining showing, no patches. The front edge follows the near leg; the back edge flutters in the wind.
- **Hat:** a western hat in profile.
  - The crown is low and tapered, slightly pinched at the front, with a smooth rounded top (no crease), and has a leather band.
  - The whole hat is traced from a side-view photo of a cowboy hat (`HAT_OUTLINE` in the scene engine): the far side of the brim rises beside the crown towards the back and the front, the near side turns up to meet the crown at the band, and the tips stay low. Change it by re-tracing a reference photo, not by drawing it by hand.
  - No feather, no sprig.
- **Face:** a plain skin-tone head with no drawn nose, ear or other features, and a dark-brown beard. He sets off clean-shaven; the beard grows with every day on the road: first stubble drawn as a scatter of dots along the jaw that fills in over the first week or so, then a beard shape that lengthens until it is full after 60 days, after which it stops growing. Never a moustache. No blush and no visible eyes; the brim shades them.
- **Backpack:** a soft, lumpy canvas sack seen from the side.
  - The outline is uneven: narrower at the top, bulging at the bottom, with a dent between. The top is gathered and tied with a cord.
  - It has a side pocket and a tin mug hanging on the side.
  - A rolled beige sleeping mat lies across the top. In this side view only its end shows: a round roll with a spiral, held by two leather straps.
- **Trousers and boots:** graphite-navy trousers, low brown ankle boots (the boot covers only the last quarter of the shin).

### Palette

| Part                   | Colour                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Cape                   | `#3B3338`, shaded side `#2A2428`                                                                                     |
| Hat                    | brown like the boots `#5E3F2A`, shaded side `#47301F`, band `#6E3A26` with a gold `#E7B45A` and red `#B4452E` zigzag |
| Beard                  | `#6D5847`, shaded side `#56463A`                                                                                     |
| Skin                   | `#E8B993`, shaded side `#C9946F`                                                                                     |
| Shirt (barely visible) | `#DCCDAA`                                                                                                            |
| Trousers               | `#3A3F52`, far leg `#2B2F3E`                                                                                         |
| Boots                  | `#5A3D28`                                                                                                            |
| Backpack               | `#86704F`, shaded side `#65523A`, pocket and flap `#75603F`, straps `#4A3A2C`                                        |
| Sleeping mat           | `#D9C7A3`, spiral `#A8946F`, end `#E8D9BA`                                                                           |
| Pipe                   | `#4A3324`, glowing ember when he draws on it                                                                         |

The dark cape is the mysterious silhouette. The light backpack and mat keep him readable against dark forests and at night.

### Animation

- **Walk cycle:**
  - Duration and stride: about 1 s per two steps, stride 15 units, centred under the hip. Matched to the ground speed so that planted feet never slide.
  - Legs: two-bone IK, knees bend forward.
  - Foot roll: heel strike with the toe up, then a flat foot. The heel lifts at the end of the stance and the foot pushes off the toe.
  - Swing: the foot lifts with a sin² curve, so it lands softly with no stomping.
  - Body: the hip bobs about 1.6 units, slightly after foot contact. The lean is small (about 0.02–0.05 rad).
  - Arms: they swing opposite to the legs, and the far hand rests in a pocket. In a strong gust, the free hand holds the hat.
  - Backpack: it bounces slightly, a moment after the body.
  - Pauses: now and then (about every 80 seconds) he stops for a few seconds and raises his head to take in the view, then walks on.
  - Pipe on the road: some stretches he walks with the pipe in his teeth; a thin wisp rises from the bowl.
  - Little gestures, each rare and at a fixed moment of its loop: he drinks from a leather waterskin (twice as often around midday and on the Meseta, never while smoking), tugs his backpack straps with both hands, straightens his hat, and kicks a pebble lying on the path so it skips ahead and comes to rest.
  - On meadows and the Meseta some stretches he walks with a stalk of grass between his lips (never at the same time as the pipe).
- **Morning:** at 06:36 he gets up and stretches once, for a few seconds, with both arms over his head and his head tipped back in a yawn. The stump is packed away with the tent. Until about 07:00 he packs up, bent forward with his hands busy low in front of him; then he stands ready and sets off at 07:12.
- **Camp:**
  - He sits on a tall stump, knees up, with a soft breathing motion.
  - For most of a 30-second cycle he smokes a pipe. Every 6 seconds he raises it to his mouth for about two seconds: the ember in the bowl glows, then he lowers the pipe and breathes out a little smoke. A thin wisp rises from the bowl the whole time.
  - Otherwise he holds a steaming mug, sips now and then and sometimes looks up at the sky.
- **Sleep:** late at night he fades into the tent and the tent glows from inside.

### Daily schedule

| Hour        | State                                            |
| ----------- | ------------------------------------------------ |
| 7:12–19:18  | Walking                                          |
| 19:18–20:18 | Stops, sets up camp (tent fades in, fire lights) |
| 20:18–23:00 | Rests by the fire                                |
| 23:00–5:12  | Sleeps in the tent, fire burns low               |
| 6:24–7:12   | Packs up camp                                    |

## 7. Camp

- **Tent:** a canvas A-frame `#C9A46A`, shaded side `#A8834E`, with guy lines and pegs. About 2.1 × the size of the drawn tent units, so it stands clearly taller than the wanderer. The door is dark by day and warm when he sleeps inside.
- **Seat:** a tall wooden stump with an end-grain ring. The backpack leans against it.
- **Fire:** a stone ring and crossed logs.
  - The flames are layered tongues in four colours, from deep red to pale yellow.
  - Over the fire stands a tripod with a hanging kettle.
  - Around it: sparks, slow smoke drifting with the wind, and a warm ground glow that also tints the wanderer and the props.
- **Lantern:** a small lantern on the ground, lit after dark.

## 8. The starling

- A small, dark, glossy starling with pale speckles, a yellow beak and an eye glint.
- Over a 46-second cycle it flies in from beyond the left edge, perches on the sleeping mat and hops now and then, then flies off past the right edge, speeding up as it goes. It never appears or disappears while on screen.
- At camp it perches on the tent pole. After dark it roosts there and stays all night.

## 9. Ambient life

- Grass tufts sway with a slowly changing wind. They are drawn **behind** the wanderer, never over him.
- Flowers in the grass depend on the biome.
- Morning mist bands drift through the valleys.
- Sun rays appear at low sun, stronger in the forest.
- Bird flocks cross the sky by day.
- Fireflies come out at night.
- Occasional shooting stars.
- Cabin windows light up at night.

## 10. Don'ts

- No recreation of existing characters or their signature looks. The wanderer may share the spirit of the classic free, solitary wanderer, but never these traits:
  - a pointed hat with a feather,
  - a harmonica,
  - green as the main colour,
  - a fishing rod as an attribute,
  - troll-like anatomy.
- No music or note symbols.
- No route waymarkers drawn in the scene (no Camino shell signs).
- No outlines, no gradients on characters, no photographic textures.
- Nothing lights the scene from a source the viewer cannot see.
- Grass and foreground decoration never cover the wanderer.
- No fast or bouncy motion. If something moves, it moves gently.
