---
name: wayfarer-biomes
description: Biome map and biome design rules for the Wayfarer walking game (Baltic → Santiago de Compostela route). Load when adding, changing or reviewing a biome, a regional variant, a route segment or a biome transition in the Wayfarer project (~/projects/wayfarer). The project's docs/style-guide.md always wins on visual details.
---

Wayfarer is a slow, cozy walking game: a wanderer crosses real regions at the pace of the player's real steps. The main scene is a fixed side view built from parallax layers drawn in code (PixiJS). Visual rules live in `~/projects/wayfarer/docs/style-guide.md`; read it before drawing anything.

## Route biome map: Baltic → Santiago (about 3,200 km)

| #   | Stretch                   | Biome                                                  | Character                                                    | Family            |
| --- | ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | ----------------- |
| 1   | Polish coast              | **Baltic coast** (done)                                | open sea, beach, coastal pines, lighthouse                   | water             |
| 2   | Pomerania, Kashubia       | **Lake district** (done, "Pojezierze")                 | lakes in forests, hills, wooden cabins                       | water + forest    |
| 3   | Kuyavia, Greater Poland   | **Polish fields** (done)                               | plains, rapeseed and grain, tree-lined roads, brick churches | fields            |
| 4   | Lower Silesia             | Sudetes foothills                                      | soft hills, castles on rocks                                 | hills             |
| 5   | Saxony, Thuringia         | German forests and villages                            | broadleaf forests, half-timbered houses                      | forest            |
| 6   | Franconia, Hesse          | River valleys                                          | river, stone bridges, vineyards on slopes                    | water + vineyards |
| 7   | Rhineland, Lorraine       | Riverside vineyards                                    | steep vineyards, castles above the water                     | vineyards         |
| 8   | Burgundy                  | Rural France                                           | hedgerows, stone villages, abbeys                            | fields            |
| 9   | Massif Central            | Volcanic uplands                                       | green volcanic domes, dry-stone walls                        | hills             |
| 10  | Aubrac                    | High plateau                                           | windy pastures, granite boulders, cattle                     | fields            |
| 11  | Lot valley, Gascony       | Southern France                                        | limestone cliffs, medieval towns, sunflowers                 | hills + fields    |
| 12  | Pyrenees                  | High mountains (variant of "Mountains and lake", done) | passes, mist, sheep                                          | mountains         |
| 13  | Navarre, La Rioja         | Spanish vineyards                                      | red earth, vines, brick villages                             | vineyards         |
| 14  | Castile                   | **Meseta** (done)                                      | golden fields, huge sky                                      | fields            |
| 15  | Montes de León, El Bierzo | Spanish mountains                                      | heath, chestnuts, slate roofs                                | mountains         |
| 16  | Galicia                   | Green Galicia                                          | mist, moss, eucalyptus, stone granaries, rain                | forest            |
| ★   | Santiago                  | Special scene                                          | the cathedral at the end of the road                         | special           |

Already built in the demo: Baltic coast, Polish fields, Mountains and lake, Beech forest, Meseta.

Suggested build order: the Polish stretch first (Baltic, lake district, fields), because every player spends their first weeks there. Then transitions between biomes. Then the later biomes, in route order, ahead of the players.

Pacing: about 10,000 steps a day is about 7 km. The full route takes over a year, so each biome is on screen for 3–4 weeks. Every biome needs variety inside it: seasons, weather, rare spots and milestones.

## A biome is data

A biome is a config object, not new code:

- an optional water level (`lake`), plus water tint, body colour and shimmer;
- a list of layers, far to near, each with: `kind` (`ridge`, `hill`, `ground`), `depth` (1 = farthest), `base`, `amp`, `wave`, `oct`, `speed` (parallax), `color`, `fog`;
- optional features on a layer: `snow`, `faces`, `trees` (type, spacing, height range, density, groves, own `color`), `cabins`, `village`, `rows`, `path`, `grass`, `flowers`, `tufts`, `beach`, `boats`, `groynes`, `lighthouse`, `fence`;
- mist positions, cloud count, ray strength, firefly amount and bird colour.

Reuse before you invent:

- **Families:** mountains, hills, fields, forest, water, vineyards. A regional variant changes colours, tree types and buildings.
- **Buildings by region:** wooden cabin, half-timbered house, stone house, brick church, Galician granary. Each is a wall colour, a roof colour and a shape.

## Realism checks (learned the hard way)

Before showing a biome, check it against the real place.

- **No invented geography.** The Baltic has no islands or headlands off the Polish coast; its horizon is clean and flat. Don't add land features a region doesn't have.
- **Things grow where they really grow.** No trees on the beach or on bare sand. Pines stand on green ground behind the beach.
- **Get the plant right.** A pine is a conifer: a loose spruce shape, with a bare lower trunk, uneven tiers set high and a slight lean. It is not a round broadleaf crown and not a neat fir.
- **Trees take their own colour,** never the colour of the ground they stand on.
- **Landmarks are rare and in scale.**
  - One lighthouse per long stretch of coast, never two side by side.
  - A lighthouse stands on land, not on dunes or water, and is clearly taller than nearby trees.
  - It turns full circle: the beam is a cone, narrow at the lamp and widening, and it flares when it faces the viewer.
- **Order of planes:** what is farther is higher and hazier. Water sits behind the shore. Nothing in front may hide the wanderer.
- **Light only from visible sources.** A sun or moon hidden by terrain lights nothing (no reflection, rim light or rays).
- **Check every time of day** (midday, sunset, night) and portrait as well as landscape before calling a biome done.

## Elevation levels

Mountain biomes (Mountains and lake, Beech forest, and later the Pyrenees, Montes de León and the volcanic uplands) come in three heights: low, mid and high. A level reshapes the same biome instead of copying it:

- **Low (foothills):** gentler relief, no snow, denser forest, more cabins.
- **Mid:** the biome as defined.
- **High:** steeper relief and more snow. Towards the tree line the forest thins out, the trees get shorter and conifers take over, and there are fewer cabins.

Coast and plains biomes have a single level. A route segment says the biome and its level for each stretch, taken from the real elevation.

## Transitions

A route segment says which biome covers which kilometres. Between two biomes, blend over a few kilometres: layer colours, tree types and densities cross-fade, so the landscape never cuts from one biome to the next.
